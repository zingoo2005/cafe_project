<?php

namespace App\Services\Interfaces;

use App\Models\Cafe;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CafeServiceInterface
{
    public function listApproved(array $filters): LengthAwarePaginator;

    public function listAll(User $user, array $filters): LengthAwarePaginator;

    public function listForMap(array $filters): LengthAwarePaginator;

    public function getApproved(Cafe $cafe): Cafe;

    public function listForUser(User $user): LengthAwarePaginator;

    public function submit(User $user, array $data): Cafe;

    public function update(User $user, Cafe $cafe, array $data): Cafe;

    public function delete(User $user, Cafe $cafe): void;

    public function createDirectoryCafe(User $user, array $data): Cafe;

    public function updateDirectoryCafe(User $user, Cafe $cafe, array $data): Cafe;

    public function deleteDirectoryCafe(User $user, Cafe $cafe): void;

    public function listNearby(float $latitude, float $longitude, float $radiusKm, array $filters): LengthAwarePaginator;
}
