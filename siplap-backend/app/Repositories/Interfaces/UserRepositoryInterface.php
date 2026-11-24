<?php

namespace App\Repositories\Interfaces;

use App\Models\User;

interface UserRepositoryInterface
{
    public function create(array $data): User;

    public function findByEmail(string $email): ?User;

    public function findById(int $id): ?User;

    public function update(User $user, array $data): User;

    public function delete(User $user): void;

    public function updatePassword(User $user, string $password, string $rememberToken): void;

    public function createApiToken(User $user, string $name = 'api'): string;

    public function revokeApiToken(string $plainTextToken): void;

    public function revokeAllApiTokens(User $user): void;
}
