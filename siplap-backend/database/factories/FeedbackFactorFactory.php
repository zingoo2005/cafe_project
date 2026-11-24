<?php

namespace Database\Factories;

use App\Models\AttractionFactor;
use App\Models\Feedback;
use App\Models\FeedbackFactor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<FeedbackFactor>
 */
class FeedbackFactorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'feedback_id' => Feedback::factory(),
            'attraction_factor_id' => AttractionFactor::factory(),
            'agrees' => fake()->boolean(),
        ];
    }
}
