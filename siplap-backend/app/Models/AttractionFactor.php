<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttractionFactor extends Model
{
    use HasFactory;

    protected $fillable = ['purpose_id', 'name', 'slug', 'is_custom', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_custom' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    public function purpose(): BelongsTo
    {
        return $this->belongsTo(Purpose::class);
    }

    public function posts(): BelongsToMany
    {
        return $this->belongsToMany(Post::class, 'post_attraction_factors')->withTimestamps();
    }

    public function feedbackFactors(): HasMany
    {
        return $this->hasMany(FeedbackFactor::class);
    }

    public function cafeReviews(): BelongsToMany
    {
        return $this->belongsToMany(CafeReview::class, 'cafe_review_attraction_factors')->withTimestamps();
    }
}
