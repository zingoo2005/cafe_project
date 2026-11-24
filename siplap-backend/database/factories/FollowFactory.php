<?php

namespace Database\Factories;

use App\Models\Follow;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Follow>
 */
class FollowFactory extends Factory
{
    public function definition(): array
    {
        $follower = User::factory();

        return [
            'follower_id' => $follower,
            'following_id' => User::factory(),
        ];
    }
}
