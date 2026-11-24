<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Models\CafeReview;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\Purpose;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EngagementController extends Controller
{
    public function reviewOptions(): JsonResponse
    {
        return response()->json([
            'data' => Purpose::query()
                ->where('is_active', true)
                ->with(['attractionFactors' => fn ($query) => $query->where('is_active', true)->orderBy('name')])
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function favorites(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->favoriteCafes()
                ->where('status', 'approved')
                ->withAvg('reviews', 'rating')
                ->latest('cafe_favorites.created_at')
                ->paginate(15),
        ]);
    }

    public function addFavorite(Request $request, Cafe $cafe): JsonResponse
    {
        abort_unless($cafe->status === 'approved', 404);

        $request->user()->favoriteCafes()->syncWithoutDetaching([$cafe->id]);

        return response()->json([
            'message' => 'Café added to favorites.',
            'data' => $cafe,
        ], 201);
    }

    public function removeFavorite(Request $request, Cafe $cafe): JsonResponse
    {
        $request->user()->favoriteCafes()->detach($cafe->id);

        return response()->json(['message' => 'Café removed from favorites.']);
    }

    public function reviews(Cafe $cafe): JsonResponse
    {
        $this->ensureReviewable($cafe);

        return response()->json([
            'data' => $cafe->reviews()
                ->with(['user:id,name', 'purposeTags:id,name', 'attractionFactors:id,name,purpose_id', 'customFactors:id,cafe_review_id,name'])
                ->latest()
                ->paginate(15),
            'rating' => $cafe->reviews()->avg('rating'),
            'review_count' => $cafe->reviews()->count(),
        ]);
    }

    public function myReviews(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->reviews()->with('cafe:id,name,township,area')
                ->with(['purposeTags:id,name', 'attractionFactors:id,name,purpose_id', 'customFactors:id,cafe_review_id,name'])
                ->latest()
                ->paginate(15),
        ]);
    }

    public function myCafeReview(Request $request, Cafe $cafe): JsonResponse
    {
        return response()->json([
            'data' => $cafe->reviews()
                ->where('user_id', $request->user()->id)
                ->with(['purposeTags:id,name', 'attractionFactors:id,name,purpose_id', 'customFactors:id,cafe_review_id,name'])
                ->first(),
        ]);
    }

    public function createReview(Request $request, Cafe $cafe): JsonResponse
    {
        $this->ensureReviewable($cafe);

        $data = $this->validateReviewData($request);
        $this->validateFactorPurposePairs($data);

        if ($cafe->reviews()->where('user_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this café.'], 409);
        }

        $review = DB::transaction(function () use ($request, $cafe, $data) {
            $review = $request->user()->reviews()->create([
                'cafe_id' => $cafe->id,
                'rating' => $data['rating'],
                'body' => $data['body'] ?? null,
            ]);
            $this->syncReviewTags($review, $data, true);

            return $review;
        });

        $this->refreshCafeRating($cafe);

        return response()->json([
            'message' => 'Review created.',
            'data' => $review->load(['purposeTags:id,name', 'attractionFactors:id,name,purpose_id', 'customFactors:id,cafe_review_id,name']),
        ], 201);
    }

    public function updateReview(Request $request, Cafe $cafe): JsonResponse
    {
        $this->ensureReviewable($cafe);
        $review = $cafe->reviews()->where('user_id', $request->user()->id)->firstOrFail();
        $data = $this->validateReviewData($request, true);
        $this->validateFactorPurposePairs($data, $review);

        DB::transaction(function () use ($review, $data) {
            $review->update(collect($data)->only(['rating', 'body'])->all());
            $this->syncReviewTags($review, $data);
        });
        $this->refreshCafeRating($cafe);

        return response()->json([
            'message' => 'Review updated.',
            'data' => $review->fresh()->load(['purposeTags:id,name', 'attractionFactors:id,name,purpose_id', 'customFactors:id,cafe_review_id,name']),
        ]);
    }

    public function deleteReview(Request $request, CafeReview $review): JsonResponse
    {
        abort_unless($review->user_id === $request->user()->id, 403);

        $cafe = $review->cafe;
        $review->delete();
        $this->refreshCafeRating($cafe);

        return response()->json(['message' => 'Review deleted.']);
    }

    public function reportPost(Request $request, Post $post): JsonResponse
    {
        abort_unless($post->status === 'published', 404);

        $data = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        if (PostReport::where('post_id', $post->id)->where('reporter_id', $request->user()->id)->exists()) {
            return response()->json(['message' => 'You have already reported this post.'], 409);
        }

        $report = $post->reports()->create([
            'reporter_id' => $request->user()->id,
            'reason' => $data['reason'],
        ]);

        return response()->json(['message' => 'Report submitted.', 'data' => $report], 201);
    }

    private function refreshCafeRating(Cafe $cafe): void
    {
        $cafe->update(['rating' => $cafe->reviews()->avg('rating')]);
    }

    private function ensureReviewable(Cafe $cafe): void
    {
        abort_unless(in_array($cafe->status, ['approved', 'pending'], true), 404);
    }

    private function validateReviewData(Request $request, bool $partial = false): array
    {
        $validator = Validator::make($request->all(), [
            'rating' => [$partial ? 'sometimes' : 'required', 'integer', 'between:1,5'],
            'body' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'purpose_ids' => [$partial ? 'sometimes' : 'required', 'array', 'min:1', 'max:6'],
            'purpose_ids.*' => ['required', 'integer', 'distinct', Rule::exists('purposes', 'id')->where('is_active', true)],
            'attraction_factor_ids' => ['sometimes', 'array', 'max:30'],
            'attraction_factor_ids.*' => ['required', 'integer', 'distinct', Rule::exists('attraction_factors', 'id')->where('is_active', true)],
            'custom_factors' => ['sometimes', 'array', 'max:10'],
            'custom_factors.*' => ['required', 'string', 'min:2', 'max:100'],
        ]);
        $validator->after(function ($validator) use ($request, $partial) {
            $hasUpdatedTags = ! $partial
                || $request->exists('purpose_ids')
                || $request->exists('attraction_factor_ids')
                || $request->exists('custom_factors');

            if (! $hasUpdatedTags) {
                return;
            }

            $factorIds = $request->input('attraction_factor_ids', []);
            $customFactors = collect($request->input('custom_factors', []))
                ->map(fn ($factor) => is_string($factor) ? trim($factor) : '')
                ->filter();

            if (count($factorIds) === 0 && $customFactors->isEmpty()) {
                $validator->errors()->add('attraction_factor_ids', 'Select or add at least one attraction factor.');
            }
        });

        return $validator->validate();
    }

    private function validateFactorPurposePairs(array $data, ?CafeReview $review = null): void
    {
        $purposeIds = $data['purpose_ids'] ?? $review?->purposeTags()->pluck('purposes.id')->all() ?? [];
        $factorIds = $data['attraction_factor_ids'] ?? [];

        if ($factorIds === []) {
            return;
        }

        $matchingFactors = DB::table('attraction_factors')
            ->whereIn('id', $factorIds)
            ->whereIn('purpose_id', $purposeIds)
            ->count();

        if ($matchingFactors !== count(array_unique($factorIds))) {
            throw ValidationException::withMessages([
                'attraction_factor_ids' => ['Each attraction factor must belong to one of the selected purposes.'],
            ]);
        }
    }

    private function syncReviewTags(CafeReview $review, array $data, bool $creating = false): void
    {
        if ($creating || array_key_exists('purpose_ids', $data)) {
            $review->purposeTags()->sync($data['purpose_ids'] ?? []);
        }

        if ($creating || array_key_exists('attraction_factor_ids', $data)) {
            $review->attractionFactors()->sync($data['attraction_factor_ids'] ?? []);
        }

        if ($creating || array_key_exists('custom_factors', $data)) {
            $review->customFactors()->delete();
            $names = collect($data['custom_factors'] ?? [])
                ->map(fn (string $name) => trim($name))
                ->filter()
                ->unique(fn (string $name) => mb_strtolower($name))
                ->values();

            $review->customFactors()->createMany($names->map(fn (string $name) => ['name' => $name])->all());
        }
    }
}
