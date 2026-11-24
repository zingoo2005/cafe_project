<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CafeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'street_address' => $this->street_address,
            'township' => $this->township,
            'area' => $this->area,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'phone' => $this->phone,
            'website' => $this->website,
            'image' => $this->image,
            'type' => $this->type,
            'tags' => $this->tags ?? [],
            'rating' => $this->reviews_avg_rating ?? $this->rating,
            'community_posts' => $this->whenLoaded(
                'posts',
                fn () => $this->posts->map(fn ($post) => [
                    'id' => $post->id,
                    'title' => $post->title,
                    'body' => $post->body,
                    'created_at' => $post->created_at,
                ])->values()
            ),
            'review_purposes' => $this->whenLoaded(
                'reviews',
                fn () => $this->reviews
                    ->flatMap(fn ($review) => $review->purposeTags)
                    ->unique('id')
                    ->values()
                    ->map(fn ($purpose) => ['id' => $purpose->id, 'name' => $purpose->name])
            ),
            'distance_km' => $this->distance_km,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
