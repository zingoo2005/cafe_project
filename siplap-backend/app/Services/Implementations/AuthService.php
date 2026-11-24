<?php

namespace App\Services\Implementations;

use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\Interfaces\AuthServiceInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AuthService implements AuthServiceInterface
{
    public function __construct(private readonly UserRepositoryInterface $users) {}

    public function register(array $data): array
    {
        unset($data['role'], $data['status'], $data['banned_at']);
        $user = $this->users->create($data)->refresh();
        $user->sendEmailVerificationNotification();

        return [
            'user' => $user,
            'token' => $this->users->createApiToken($user),
        ];
    }

    public function login(string $email, string $password): array
    {
        $user = $this->users->findByEmail($email);

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->banned_at || $user->status === 'suspended') {
            throw new HttpException(403, 'This account has been suspended.');
        }

        return [
            'user' => $user,
            'token' => $this->users->createApiToken($user),
        ];
    }

    public function logout(?string $plainTextToken): void
    {
        if ($plainTextToken) {
            $this->users->revokeApiToken($plainTextToken);
        }
    }

    public function updateProfile(User $user, array $data, ?UploadedFile $avatar = null): User
    {
        $emailChanged = isset($data['email']) && $data['email'] !== $user->email;
        if ($emailChanged) {
            $data['email_verified_at'] = null;
        }

        if ($avatar) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }

            $data['avatar'] = $avatar->store('avatars', 'public');
        }

        unset($data['role'], $data['status'], $data['banned_at']);

        $updatedUser = $this->users->update($user, $data);
        if ($emailChanged) {
            $updatedUser->sendEmailVerificationNotification();
        }

        return $updatedUser;
    }

    public function removeAvatar(User $user): User
    {
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        return $this->users->update($user, ['avatar' => null]);
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $this->users->update($user, ['password' => $newPassword]);
        $this->users->revokeAllApiTokens($user);
    }

    public function deleteAccount(User $user): void
    {
        $avatar = $user->avatar;

        DB::transaction(function () use ($user): void {
            $this->users->revokeAllApiTokens($user);
            $this->users->delete($user);
        });

        if ($avatar) {
            Storage::disk('public')->delete($avatar);
        }
    }

    public function requestPasswordReset(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $data): string
    {
        return Password::reset($data, function (User $user, string $password): void {
            $this->users->updatePassword($user, $password, Str::random(60));
            $this->users->revokeAllApiTokens($user);
        });
    }

    public function sendEmailVerification(User $user): void
    {
        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }
    }

    public function verifyEmail(User $user, string $hash): bool
    {
        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403);
        }

        return $user->markEmailAsVerified();
    }
}
