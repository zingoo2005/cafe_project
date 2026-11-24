<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;

class AdminUserResource extends UserResource
{
    public function toArray(Request $request): array
    {
        return array_merge(parent::toArray($request), [
            'banned_at' => $this->banned_at,
            'updated_at' => $this->updated_at,
        ]);
    }
}
