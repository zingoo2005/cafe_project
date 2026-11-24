<?php

namespace App\Repositories\Implementations;

use App\Models\ApiToken;
use App\Models\User;
use App\Repositories\Interfaces\UserRepositoryInterface;

class EloquentUserRepository implements UserRepositoryInterface
{
    public function create(array $data): User
    {
        return User::create($data);
    }

    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    public function findById(int $id): ?User
    {
        return User::find($id);
    }

    public function update(User $user, array $data): User
    {
        $allowed = ['name', 'username', 'email', 'email_verified_at', 'bio', 'location', 'avatar', 'password'];
        $user->forceFill(array_intersect_key($data, array_flip($allowed)))->save();

        return $user->fresh();
    }

    public function delete(User $user): void
    {
        $user->delete();
    }

    public function updatePassword(User $user, string $password, string $rememberToken): void
    {
        $user->forceFill([
            'password' => $password,
            'remember_token' => $rememberToken,
        ])->save();
    }

    public function createApiToken(User $user, string $name = 'api'): string
    {
        $plainTextToken = bin2hex(random_bytes(32));

        $user->apiTokens()->create([
            'token' => hash('sha256', $plainTextToken),
            'name' => $name,
        ]);

        return $plainTextToken;
    }

    public function revokeApiToken(string $plainTextToken): void
    {
        ApiToken::where('token', hash('sha256', $plainTextToken))->delete();
    }

    public function revokeAllApiTokens(User $user): void
    {
        $user->apiTokens()->delete();
    }
}
