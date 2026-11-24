<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purpose extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function attractionFactors(): HasMany
    {
        return $this->hasMany(AttractionFactor::class);
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_purposes')->withTimestamps();
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function cafeReviews(): BelongsToMany
    {
        return $this->belongsToMany(CafeReview::class, 'cafe_review_purposes')->withTimestamps();
    }

    public function topPicks(): HasMany
    {
        return $this->hasMany(TopPick::class);
    }
}
