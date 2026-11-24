<?php

namespace Database\Factories;

use App\Models\Cafe;
use App\Models\CafeReview;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CafeReview>
 */
class CafeReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'cafe_id' => Cafe::factory(),
            'rating' => fake()->numberBetween(1, 5),
            'body' => fake()->optional()->paragraph(),
        ];
    }
}
