<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cafe extends Model
{
     protected $fillable = [
        'user_id',
        'name',
        'area',
        'township',
        'street_address',
        'type',
        'description',
        'tags',
        'image',
        'rating',
        'latitude',
        'longitude',
        'status',
    ];

    protected $casts = [
        'tags' => 'array',
        'rating' => 'decimal:1',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
    ];
}
