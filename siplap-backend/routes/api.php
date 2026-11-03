
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CafeController;

Route::get('/cafes', [CafeController::class, 'index']);
