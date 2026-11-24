<?php

namespace App\Repositories\Interfaces;

use App\Models\Cafe;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface CafeRepositoryInterface
{
    public function paginateApproved(array $filters): LengthAwarePaginator;

    public function paginateAll(array $filters): LengthAwarePaginator;

    public function paginateForMap(array $filters): LengthAwarePaginator;

    public function findApproved(Cafe $cafe): Cafe;

    public function paginateForUser(User $user): LengthAwarePaginator;

    public function createForUser(User $user, array $data): Cafe;

    public function update(Cafe $cafe, array $data): Cafe;

    public function delete(Cafe $cafe): void;

    public function createForDirectory(array $data): Cafe;

    public function paginateNearby(float $latitude, float $longitude, float $radiusKm, array $filters): LengthAwarePaginator;
}
