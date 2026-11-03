<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CafeController extends Controller
{
    // Display approved cafes with pagination
    public function index(Request $request): JsonResponse
    {
        $perPage = min(
            max((int) $request->query('per_page', 9), 1),
            30
        );

        $cafes = Cafe::where('status', 'approved')
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $cafes->items(),

            'meta' => [
                'current_page' => $cafes->currentPage(),
                'last_page' => $cafes->lastPage(),
                'per_page' => $cafes->perPage(),
                'total' => $cafes->total(),
                'has_more' => $cafes->hasMorePages(),
            ],
        ]);
    }
}