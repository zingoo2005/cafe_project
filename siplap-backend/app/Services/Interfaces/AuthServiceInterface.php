<?php

namespace App\Services\Interfaces;

use App\Models\User;
use Illuminate\Http\UploadedFile;

interface AuthServiceInterface
{
    public function register(array $data): array;

    public function login(string $email, string $password): array;

    public function logout(?string $plainTextToken): void;

    public function updateProfile(User $user, array $data, ?UploadedFile $avatar = null): User;

    public function removeAvatar(User $user): User;

    public function changePassword(User $user, string $currentPassword, string $newPassword): void;

    public function deleteAccount(User $user): void;

    public function requestPasswordReset(string $email): string;

    public function resetPassword(array $data): string;

    public function sendEmailVerification(User $user): void;

    public function verifyEmail(User $user, string $hash): bool;
}
