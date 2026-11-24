<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CafeIndexRequest;
use App\Http\Requests\Api\V1\NearbyCafeRequest;
use App\Http\Requests\Api\V1\StoreCafeRequest;
use App\Http\Requests\Api\V1\UpdateCafeRequest;
use App\Http\Resources\Api\V1\CafeResource;
use App\Models\Cafe;
use App\Services\Interfaces\CafeServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CafeController extends Controller
{
    public function __construct(private readonly CafeServiceInterface $cafes) {}

    public function index(CafeIndexRequest $request)
    {
        $cafes = $this->cafes->listApproved($request->validated());

        return CafeResource::collection($cafes)
            ->additional([
                'success' => true,
                'message' => 'Cafés retrieved.',
                'meta' => ['has_more' => $cafes->hasMorePages()],
            ]);
    }

    public function mapIndex(CafeIndexRequest $request)
    {
        $cafes = $this->cafes->listForMap($request->validated());

        return CafeResource::collection($cafes)
            ->additional([
                'success' => true,
                'message' => 'Cafés retrieved for the map.',
                'meta' => ['has_more' => $cafes->hasMorePages()],
            ]);
    }

    public function nearby(NearbyCafeRequest $request)
    {
        $filters = $request->validated();

        return CafeResource::collection($this->cafes->listNearby(
            (float) $filters['latitude'],
            (float) $filters['longitude'],
            (float) ($filters['radius_km'] ?? 10),
            $filters
        ))->additional(['success' => true, 'message' => 'Nearby cafés retrieved.']);
    }

    public function adminIndex(CafeIndexRequest $request)
    {
        return CafeResource::collection($this->cafes->listAll($request->user(), $request->validated()))
            ->additional(['success' => true, 'message' => 'Café directory retrieved.']);
    }

    public function show(Cafe $cafe): JsonResponse
    {
        Gate::authorize('view', $cafe);
        $cafe = $this->cafes->getApproved($cafe);

        return response()->json([
            'success' => true,
            'data' => new CafeResource($cafe),
        ]);
    }

    public function rating(Cafe $cafe): JsonResponse
    {
        Gate::authorize('view', $cafe);

        return response()->json([
            'success' => true,
            'data' => [
                'cafe_id' => $cafe->id,
                'average_rating' => $cafe->reviews()->avg('rating'),
                'review_count' => $cafe->reviews()->count(),
            ],
        ]);
    }

    public function store(StoreCafeRequest $request): JsonResponse
    {
        $cafe = $this->cafes->createDirectoryCafe($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Café created.',
            'data' => new CafeResource($cafe),
        ], 201);
    }

    public function update(UpdateCafeRequest $request, Cafe $cafe): JsonResponse
    {
        $updated = $this->cafes->updateDirectoryCafe($request->user(), $cafe, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Café updated.',
            'data' => new CafeResource($updated),
        ]);
    }

    public function destroy(Request $request, Cafe $cafe): JsonResponse
    {
        Gate::authorize('delete', $cafe);
        $this->cafes->deleteDirectoryCafe($request->user(), $cafe);

        return response()->json(['success' => true, 'message' => 'Café deleted.']);
    }
}
