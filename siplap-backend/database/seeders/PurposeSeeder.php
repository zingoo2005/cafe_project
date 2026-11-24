<?php

namespace Database\Seeders;

use App\Models\AttractionFactor;
use App\Models\Purpose;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PurposeSeeder extends Seeder
{
    private const FACTORS = [
        'Study' => ['Quiet Environment', 'Fast Wi-Fi', 'Free Wi-Fi', 'Power Outlets', 'Comfortable Seating', 'Large Study Tables'],
        'Relax' => ['Peaceful Atmosphere', 'Calm Atmosphere', 'Good Music', 'Soft Music', 'Cozy Ambience', 'Cozy Seating', 'Nice Interior'],
        'Meeting' => ['Large Tables', 'Group Tables', 'Group Seating', 'Friendly Staff', 'Friendly Environment', 'Spacious Environment', 'Easy Conversation'],
        'Dating' => ['Romantic Atmosphere', 'Beautiful Interior', 'Cozy Seating', 'Comfortable Seating', 'Good Music', 'Nice Lighting'],
        'Work' => ['Fast Wi-Fi', 'Reliable Wi-Fi', 'Power Outlets', 'Quiet Environment', 'Comfortable Seating', 'Comfortable Workspace', 'Work-Friendly Tables'],
        'Event' => ['Spacious Environment', 'Large Space', 'Group Seating', 'Beautiful Interior', 'Friendly Staff', 'Photo-Friendly Space', 'Event-Friendly Environment'],
    ];

    public function run(): void
    {
        foreach (self::FACTORS as $purposeName => $factorNames) {
            $purpose = Purpose::query()->firstOrCreate(
                ['slug' => Str::slug($purposeName)],
                ['name' => $purposeName, 'is_active' => true]
            );

            foreach ($factorNames as $factorName) {
                AttractionFactor::query()->firstOrCreate(
                    ['purpose_id' => $purpose->id, 'slug' => Str::slug($factorName)],
                    ['name' => $factorName, 'is_custom' => false, 'is_active' => true]
                );
            }
        }
    }
}
