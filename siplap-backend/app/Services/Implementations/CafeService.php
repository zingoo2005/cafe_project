<?php

namespace App\Services\Implementations;

use App\Models\Cafe;
use App\Models\User;
use App\Repositories\Interfaces\CafeRepositoryInterface;
use App\Services\Interfaces\CafeServiceInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class CafeService implements CafeServiceInterface
{
    public function __construct(private readonly CafeRepositoryInterface $cafes) {}

    public function listApproved(array $filters): LengthAwarePaginator
    {
        return $this->cafes->paginateApproved($filters);
    }

    public function listAll(User $user, array $filters): LengthAwarePaginator
    {
        $this->authorizeAdmin($user);

        return $this->cafes->paginateAll($filters);
    }

    public function listForMap(array $filters): LengthAwarePaginator
    {
        return $this->cafes->paginateForMap($filters);
    }

    public function getApproved(Cafe $cafe): Cafe
    {
        return $this->cafes->findApproved($cafe);
    }

    public function listForUser(User $user): LengthAwarePaginator
    {
        return $this->cafes->paginateForUser($user);
    }

    public function submit(User $user, array $data): Cafe
    {
        return $this->cafes->createForUser($user, $data);
    }

    public function update(User $user, Cafe $cafe, array $data): Cafe
    {
        $this->authorizeManagement($user, $cafe);

        if (! $user->isAdmin()) {
            $data['status'] = 'pending';
        }

        return $this->cafes->update($cafe, $data);
    }

    public function delete(User $user, Cafe $cafe): void
    {
        $this->authorizeManagement($user, $cafe);
        $this->cafes->delete($cafe);
    }

    public function createDirectoryCafe(User $user, array $data): Cafe
    {
        $this->authorizeAdmin($user);

        return $this->cafes->createForDirectory($data);
    }

    public function updateDirectoryCafe(User $user, Cafe $cafe, array $data): Cafe
    {
        $this->authorizeAdmin($user);

        return $this->cafes->update($cafe, $data);
    }

    public function deleteDirectoryCafe(User $user, Cafe $cafe): void
    {
        $this->authorizeAdmin($user);
        $this->cafes->delete($cafe);
    }

    public function listNearby(float $latitude, float $longitude, float $radiusKm, array $filters): LengthAwarePaginator
    {
        return $this->cafes->paginateNearby($latitude, $longitude, $radiusKm, $filters);
    }

    private function authorizeManagement(User $user, Cafe $cafe): void
    {
        if (! $user->isAdmin() && $cafe->user_id !== $user->id) {
            throw new AccessDeniedHttpException;
        }
    }

    private function authorizeAdmin(User $user): void
    {
        if (! $user->isAdmin()) {
            throw new AccessDeniedHttpException;
        }
    }
}
