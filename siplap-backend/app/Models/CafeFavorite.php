<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeFavorite extends Model
{
    protected $fillable = ['user_id', 'cafe_id'];

    public function cafe(): BelongsTo
    {
        return $this->belongsTo(Cafe::class);
    }
}
