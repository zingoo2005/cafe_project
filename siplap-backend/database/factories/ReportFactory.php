<?php

namespace Database\Factories;

use App\Models\Post;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reporter_id' => User::factory(),
            'target_type' => Post::class,
            'target_id' => Post::factory(),
            'reason' => fake()->sentence(),
            'description' => fake()->optional()->paragraph(),
            'status' => 'pending',
        ];
    }
}
