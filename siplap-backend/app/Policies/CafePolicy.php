<?php

namespace App\Policies;

use App\Models\Cafe;
use App\Models\User;

class CafePolicy
{
    public function viewAny(?User $user): bool
    {
        return true;
    }

    public function view(?User $user, Cafe $cafe): bool
    {
        return $cafe->status === 'approved'
            || ($user !== null && ($user->isAdmin() || $cafe->user_id === $user->id));
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Cafe $cafe): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, Cafe $cafe): bool
    {
        return $user->isAdmin();
    }
}
