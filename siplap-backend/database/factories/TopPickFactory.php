<?php

namespace Database\Factories;

use App\Models\Cafe;
use App\Models\Purpose;
use App\Models\TopPick;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TopPick>
 */
class TopPickFactory extends Factory
{
    public function definition(): array
    {
        return [
            'cafe_id' => Cafe::factory(),
            'purpose_id' => Purpose::factory(),
            'featured_by' => User::factory(),
            'position' => fake()->numberBetween(0, 20),
            'starts_at' => null,
            'ends_at' => null,
        ];
    }
}
