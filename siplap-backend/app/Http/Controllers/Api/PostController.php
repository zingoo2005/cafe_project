<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Models\Post;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    /**
     * Display published posts for public Community / Discover.
     */
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Post::with([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ])
                ->where('status', 'published')
                ->latest()
                ->paginate(15),
        ]);
    }

    /**
     * Display a single post.
     */
    public function show(Request $request, Post $post): JsonResponse
    {
        abort_unless(
            $post->status === 'published'
                || $request->user()?->isAdmin()
                || $post->user_id === $request->user()?->id,
            404
        );

        return response()->json([
            'data' => $post->load([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ]),
        ]);
    }

    /**
     * Create a new community post.
     * Every new post requires admin approval.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:20000'],
            'cafe_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'township' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'purposes' => ['sometimes', 'array', 'max:6'],
            'purposes.*' => ['string', 'max:50'],
            'attraction_factors' => ['sometimes', 'array', 'max:30'],
            'attraction_factors.*' => ['string', 'max:100'],
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => [
                'image',
                'mimes:jpeg,png,webp',
                'max:5120',
            ],
        ]);

        if (
            array_key_exists('title', $data)
            && ! array_key_exists('cafe_name', $data)
        ) {
            $data['cafe_name'] = $data['title'];
        }

        if ($request->hasFile('images')) {
            $data['images'] = collect($request->file('images'))
                ->map(fn ($image) => $image->store('posts', 'public'))
                ->all();

            $data['image'] = Arr::first($data['images']);
        }

        $post = DB::transaction(function () use ($data, $request) {
            $cafeName = trim((string) ($data['cafe_name'] ?? ''));
            $township = trim((string) ($data['township'] ?? ''));

            if ($cafeName !== '' && $township !== '') {
                $matchingCafes = Cafe::query()
                    ->whereRaw('LOWER(name) = ?', [
                        mb_strtolower($cafeName),
                    ])
                    ->whereRaw('LOWER(township) = ?', [
                        mb_strtolower($township),
                    ])
                    ->limit(2)
                    ->get();

                if ($matchingCafes->count() === 1) {
                    $data['cafe_id'] = $matchingCafes->first()->id;
                } else {
                    $cafe = Cafe::create([
                        'user_id' => $request->user()->id,
                        'name' => $cafeName,
                        'township' => $township,
                        'type' => 'Coffee',
                        'status' => 'pending',
                        'image' => $data['image'] ?? null,
                    ]);

                    $data['cafe_id'] = $cafe->id;
                }
            }

            // New posts must wait for admin approval.
            $data['status'] = 'pending';

            return $request->user()->posts()->create($data);
        });

        return response()->json([
            'message' => 'Post submitted successfully. Waiting for admin approval.',
            'data' => $post->load([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ]),
        ], 201);
    }

    /**
     * Update an existing post.
     */
    public function update(Request $request, Post $post): JsonResponse
    {
        abort_unless(
            $request->user()->isAdmin()
                || $post->user_id === $request->user()->id,
            403
        );

        $data = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'body' => ['sometimes', 'required', 'string', 'max:20000'],
            'cafe_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'township' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'rating' => ['sometimes', 'nullable', 'integer', 'between:1,5'],
            'purposes' => ['sometimes', 'array', 'max:6'],
            'purposes.*' => ['string', 'max:50'],
            'attraction_factors' => ['sometimes', 'array', 'max:30'],
            'attraction_factors.*' => ['string', 'max:100'],
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => [
                'image',
                'mimes:jpeg,png,webp',
                'max:5120',
            ],
        ]);

        if (
            array_key_exists('title', $data)
            && ! array_key_exists('cafe_name', $data)
        ) {
            $data['cafe_name'] = $data['title'];
        }

        if ($request->hasFile('images')) {
            Storage::disk('public')->delete(
                $post->images ?? array_filter([$post->image])
            );

            $data['images'] = collect($request->file('images'))
                ->map(fn ($image) => $image->store('posts', 'public'))
                ->all();

            $data['image'] = Arr::first($data['images']);
        }

        // If a normal user edits a post, send it for approval again.
        if (! $request->user()->isAdmin()) {
            $data['status'] = 'pending';
        }

        $post->update($data);

        return response()->json([
            'message' => 'Post updated successfully.',
            'data' => $post->fresh()->load([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ]),
        ]);
    }

    /**
     * Delete a post.
     */
    public function destroy(Request $request, Post $post): JsonResponse
    {
        abort_unless(
            $request->user()->isAdmin()
                || $post->user_id === $request->user()->id,
            403
        );

        Storage::disk('public')->delete(
            $post->images ?? array_filter([$post->image])
        );

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully.',
        ]);
    }
}