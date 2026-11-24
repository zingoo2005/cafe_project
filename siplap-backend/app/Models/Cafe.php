<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Cafe extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'area',
        'township',
        'street_address',
        'phone',
        'website',
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

    public function reviews(): HasMany
    {
        return $this->hasMany(CafeReview::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function posts(): HasMany
    {
        return $this->hasMany(Post::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }

    public function topPicks(): HasMany
    {
        return $this->hasMany(TopPick::class);
    }
}
