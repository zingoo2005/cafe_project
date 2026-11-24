<?php

namespace Database\Factories;

use App\Models\Cafe;
use App\Models\Post;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Post>
 */
class PostFactory extends Factory
{
    public function definition(): array
    {
        $cafe = Cafe::factory();

        return [
            'user_id' => User::factory(),
            'cafe_id' => $cafe,
            'title' => fake()->sentence(4),
            'body' => fake()->paragraphs(2, true),
            'image' => null,
            'images' => [],
            'cafe_name' => fn (array $attributes) => Cafe::find($attributes['cafe_id'])?->name,
            'township' => fn (array $attributes) => Cafe::find($attributes['cafe_id'])?->township,
            'category' => null,
            'rating' => fake()->numberBetween(1, 5),
            'purposes' => [],
            'attraction_factors' => [],
            'status' => 'published',
        ];
    }
}
