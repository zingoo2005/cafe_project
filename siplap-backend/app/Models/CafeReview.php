<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CafeReview extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'cafe_id', 'rating', 'body'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cafe(): BelongsTo
    {
        return $this->belongsTo(Cafe::class);
    }

    public function purposeTags(): BelongsToMany
    {
        return $this->belongsToMany(Purpose::class, 'cafe_review_purposes')->withTimestamps();
    }

    public function attractionFactors(): BelongsToMany
    {
        return $this->belongsToMany(AttractionFactor::class, 'cafe_review_attraction_factors')->withTimestamps();
    }

    public function customFactors(): HasMany
    {
        return $this->hasMany(CafeReviewCustomFactor::class);
    }
}
