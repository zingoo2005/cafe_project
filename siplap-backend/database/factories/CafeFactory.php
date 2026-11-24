<?php

namespace Database\Factories;

use App\Models\Cafe;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Cafe>
 */
class CafeFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->company().' Café';

        return [
            'user_id' => User::factory(),
            'name' => $name,
            'slug' => Str::slug($name),
            'area' => fake()->city(),
            'township' => fake()->city(),
            'street_address' => fake()->streetAddress(),
            'phone' => fake()->phoneNumber(),
            'website' => fake()->url(),
            'type' => 'Coffee',
            'description' => fake()->paragraph(),
            'tags' => [],
            'rating' => null,
            'latitude' => fake()->latitude(),
            'longitude' => fake()->longitude(),
            'status' => 'approved',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }
}
