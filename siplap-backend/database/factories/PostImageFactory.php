<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\PostImage;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PostImage>
 */
class PostImageFactory extends Factory
{
    public function definition(): array
    {
        return [
            'post_id' => Post::factory(),
            'path' => 'posts/'.fake()->uuid().'.jpg',
            'position' => fake()->numberBetween(0, 4),
        ];
    }
}
