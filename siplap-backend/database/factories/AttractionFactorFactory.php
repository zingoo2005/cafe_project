<?php

namespace Database\Factories;

use App\Models\AttractionFactor;
use App\Models\Purpose;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<AttractionFactor>
 */
class AttractionFactorFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(2, true);

        return [
            'purpose_id' => Purpose::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name),
            'is_custom' => false,
            'is_active' => true,
        ];
    }
}
