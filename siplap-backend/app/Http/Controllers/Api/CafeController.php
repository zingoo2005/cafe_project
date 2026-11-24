<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Services\Interfaces\CafeServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CafeController extends Controller
{
    public function __construct(private readonly CafeServiceInterface $cafes) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'q' => ['sometimes', 'string', 'max:100'],
            'township' => ['sometimes', 'string', 'max:100'],
            'area' => ['sometimes', 'string', 'max:100'],
            'type' => ['sometimes', 'string', 'max:100'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:30'],
        ]);

        $cafes = $this->cafes->listApproved($filters);

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

    public function show(Cafe $cafe): JsonResponse
    {
        return response()->json([
            'data' => $this->cafes->getApproved($cafe),
        ]);
    }

    public function reviewTargets(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $cafes = Cafe::query()
            ->whereIn('status', ['approved', 'pending'])
            ->whereRaw('LOWER(name) = ?', [
                mb_strtolower(trim($filters['name']))
            ])
            ->orderBy('id')
            ->limit(10)
            ->get(['id', 'name', 'township', 'area', 'status']);

        return response()->json(['data' => $cafes]);
    }

    public function mine(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->cafes->listForUser($request->user()),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('cafes', 'public');
        }

        $cafe = $this->cafes->submit($request->user(), $data);

        return response()->json([
            'message' => 'Café submitted for approval.',
            'data' => $cafe,
        ], 201);
    }

    public function update(Request $request, Cafe $cafe): JsonResponse
    {
        $data = $request->validate($this->rules(true));

        if ($request->hasFile('image')) {
            if ($cafe->image && !filter_var($cafe->image, FILTER_VALIDATE_URL)) {
                Storage::disk('public')->delete($cafe->image);
            }

            $data['image'] = $request->file('image')->store('cafes', 'public');
        }

        $cafe = $this->cafes->update($request->user(), $cafe, $data);

        return response()->json([
            'message' => $cafe->status === 'pending'
                ? 'Café updated and submitted for approval.'
                : 'Café updated.',
            'data' => $cafe->fresh(),
        ]);
    }

    public function destroy(Request $request, Cafe $cafe): JsonResponse
    {
        $this->cafes->delete($request->user(), $cafe);

        if ($cafe->image && !filter_var($cafe->image, FILTER_VALIDATE_URL)) {
            Storage::disk('public')->delete($cafe->image);
        }

        return response()->json([
            'message' => 'Café deleted.',
        ]);
    }

    private function rules(bool $partial = false): array
    {
        $required = $partial ? 'sometimes|required' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'township' => [$required, 'string', 'max:255'],
            'type' => [$required, 'string', 'max:100'],
            'area' => ['sometimes', 'nullable', 'string', 'max:255'],
            'street_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'description' => ['sometimes', 'nullable', 'string'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
        ];
    }
}