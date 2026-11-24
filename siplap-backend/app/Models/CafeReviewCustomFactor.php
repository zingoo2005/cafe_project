<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeReviewCustomFactor extends Model
{
    use HasFactory;

    protected $fillable = ['cafe_review_id', 'name'];

    public function review(): BelongsTo
    {
        return $this->belongsTo(CafeReview::class, 'cafe_review_id');
    }
}
