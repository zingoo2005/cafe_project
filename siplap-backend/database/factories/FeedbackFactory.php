<?php

namespace Database\Factories;

use App\Models\Feedback;
use App\Models\Post;
use App\Models\Purpose;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Feedback>
 */
class FeedbackFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'post_id' => Post::factory(),
            'purpose_id' => Purpose::factory(),
            'is_suitable' => fake()->boolean(),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
