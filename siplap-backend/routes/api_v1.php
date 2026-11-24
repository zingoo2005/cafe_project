<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\CafeController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Middleware\AdminOnly;
use App\Http\Middleware\ApiTokenAuthentication;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
    Route::get('/reset-password/{token}', fn (string $token) => response()->json([
        'success' => true,
        'data' => ['token' => $token, 'email' => request()->query('email')],
    ]))->name('password.reset');
    Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::get('/cafes', [CafeController::class, 'index']);
    Route::get('/cafes/search', [CafeController::class, 'index']);
    Route::get('/cafes/nearby', [CafeController::class, 'nearby']);
    Route::get('/cafes/{cafe}/rating', [CafeController::class, 'rating']);
    Route::get('/cafes/{cafe}', [CafeController::class, 'show']);
    Route::get('/map/cafes', [CafeController::class, 'mapIndex']);
    Route::get('/map/cafes/{cafe}', [CafeController::class, 'show']);
    Route::get('/map/nearby', [CafeController::class, 'nearby']);
    Route::get('/map/search', [CafeController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);
    Route::get('/users/{user}/followers', [UserController::class, 'followers']);
    Route::get('/users/{user}/following', [UserController::class, 'following']);

    Route::middleware(ApiTokenAuthentication::class)->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::get('/profile', [AuthController::class, 'me']);
        Route::patch('/profile', [AuthController::class, 'updateProfile']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/profile/avatar', [AuthController::class, 'updateProfile']);
        Route::delete('/profile/avatar', [AuthController::class, 'removeAvatar']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
        Route::patch('/me/password', [AuthController::class, 'changePassword']);
        Route::post('/email/verification-notification', [AuthController::class, 'sendVerification'])
            ->middleware('throttle:6,1');
        Route::post('/users/{user}/follow', [UserController::class, 'follow']);
        Route::delete('/users/{user}/follow', [UserController::class, 'unfollow']);
        Route::delete('/account', [UserController::class, 'destroy']);
    });

    Route::middleware([ApiTokenAuthentication::class, AdminOnly::class])
        ->prefix('admin')
        ->group(function () {
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{user}', [AdminUserController::class, 'show']);
            Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);
            Route::patch('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
            Route::get('/cafes', [CafeController::class, 'adminIndex']);
            Route::post('/cafes', [CafeController::class, 'store']);
            Route::put('/cafes/{cafe}', [CafeController::class, 'update']);
            Route::patch('/cafes/{cafe}', [CafeController::class, 'update']);
            Route::delete('/cafes/{cafe}', [CafeController::class, 'destroy']);
        });
});
