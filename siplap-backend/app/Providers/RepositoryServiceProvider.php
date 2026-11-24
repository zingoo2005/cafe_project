<?php

namespace App\Providers;

use App\Repositories\Implementations\EloquentCafeRepository;
use App\Repositories\Implementations\EloquentUserRepository;
use App\Repositories\Interfaces\CafeRepositoryInterface;
use App\Repositories\Interfaces\UserRepositoryInterface;
use App\Services\Implementations\AuthService;
use App\Services\Implementations\CafeService;
use App\Services\Interfaces\AuthServiceInterface;
use App\Services\Interfaces\CafeServiceInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(CafeRepositoryInterface::class, EloquentCafeRepository::class);
        $this->app->bind(CafeServiceInterface::class, CafeService::class);
        $this->app->bind(UserRepositoryInterface::class, EloquentUserRepository::class);
        $this->app->bind(AuthServiceInterface::class, AuthService::class);
    }
}
