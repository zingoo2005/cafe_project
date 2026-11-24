
<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CafeController;
use App\Http\Controllers\Api\EngagementController;
use App\Http\Controllers\Api\PostController;
use App\Http\Middleware\AdminOnly;
use App\Http\Middleware\ApiTokenAuthentication;
use Illuminate\Support\Facades\Route;

$registerApiRoutes = static function (): void {

    // AUTHENTICATION
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('throttle:10,1');

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');

    // PUBLIC CAFES
    Route::get('/cafes', [CafeController::class, 'index']);
    Route::get('/cafe-review-targets', [CafeController::class, 'reviewTargets']);
    Route::get('/cafe-review-options', [EngagementController::class, 'reviewOptions']);
    Route::get('/cafes/{cafe}', [CafeController::class, 'show']);
    Route::get('/cafes/{cafe}/reviews', [EngagementController::class, 'reviews']);

    // PUBLIC COMMUNITY POSTS
    Route::get('/posts', [PostController::class, 'index']);
    Route::get('/posts/{post}', [PostController::class, 'show']);

    // AUTHENTICATED USER ROUTES
    Route::middleware(ApiTokenAuthentication::class)->group(function () {

        // AUTH
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'profile']);
        Route::patch('/me', [AuthController::class, 'updateProfile']);
        Route::delete('/me/avatar', [AuthController::class, 'deleteAvatar']);
        Route::patch('/me/password', [AuthController::class, 'changePassword']);

        // CAFES
        Route::post('/cafes', [CafeController::class, 'store']);
        Route::get('/my/cafes', [CafeController::class, 'mine']);
        Route::match(['put', 'patch'], '/cafes/{cafe}', [CafeController::class, 'update']);
        Route::delete('/cafes/{cafe}', [CafeController::class, 'destroy']);

        // FAVOURITES
        Route::get('/favorites', [EngagementController::class, 'favorites']);
        Route::post('/cafes/{cafe}/favorite', [EngagementController::class, 'addFavorite']);
        Route::delete('/cafes/{cafe}/favorite', [EngagementController::class, 'removeFavorite']);

        // CAFE REVIEWS
        Route::get('/my/reviews', [EngagementController::class, 'myReviews']);
        Route::get('/cafes/{cafe}/my-review', [EngagementController::class, 'myCafeReview']);
        Route::post('/cafes/{cafe}/reviews', [EngagementController::class, 'createReview']);
        Route::match(['put', 'patch'], '/cafes/{cafe}/reviews', [EngagementController::class, 'updateReview']);
        Route::delete('/reviews/{review}', [EngagementController::class, 'deleteReview']);

        // COMMUNITY POSTS
        Route::post('/posts', [PostController::class, 'store']);
        Route::match(['put', 'patch'], '/posts/{post}', [PostController::class, 'update']);
        Route::delete('/posts/{post}', [PostController::class, 'destroy']);
        Route::post('/posts/{post}/reports', [EngagementController::class, 'reportPost']);
    });

    // ADMIN ROUTES
    Route::middleware([
        ApiTokenAuthentication::class,
        AdminOnly::class,
    ])->prefix('admin')->group(function () {

        // USER MANAGEMENT
        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{user}/ban', [AdminController::class, 'setBan']);
        Route::patch('/users/{user}/role', [AdminController::class, 'setRole']);

        // CAFE APPROVALS
        Route::get('/cafes/pending', [AdminController::class, 'pendingCafes']);
        Route::patch('/cafes/{cafe}/approval', [AdminController::class, 'reviewCafe']);

        // COMMUNITY POST APPROVALS
        Route::get('/posts/pending', [AdminController::class, 'pendingPosts']);
        Route::patch('/posts/{post}/moderation', [AdminController::class, 'moderatePost']);

        // POST REPORTS
        Route::get('/reports', [AdminController::class, 'reports']);

        // MODERATION HISTORY
        Route::get('/moderation/history', [AdminController::class, 'moderationHistory']);
    });
};

Route::group([], $registerApiRoutes);

require __DIR__.'/api_v1.php';
