<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeedbackFactor extends Model
{
    use HasFactory;

    protected $fillable = ['feedback_id', 'attraction_factor_id', 'agrees'];

    protected function casts(): array
    {
        return ['agrees' => 'boolean'];
    }

    public function feedback(): BelongsTo
    {
        return $this->belongsTo(Feedback::class);
    }

    public function attractionFactor(): BelongsTo
    {
        return $this->belongsTo(AttractionFactor::class);
    }
}
