<?php

namespace App\Http\Requests\Api\V1;

use App\Models\Cafe;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCafeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $cafe = $this->route('cafe');

        return $this->user()?->can('update', $cafe) === true;
    }

    public function rules(): array
    {
        /** @var Cafe $cafe */
        $cafe = $this->route('cafe');

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'alpha_dash', 'max:255', Rule::unique('cafes', 'slug')->ignore($cafe->id)],
            'description' => ['sometimes', 'nullable', 'string', 'max:10000'],
            'street_address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'township' => ['sometimes', 'required', 'string', 'max:255'],
            'area' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'website' => ['sometimes', 'nullable', 'url', 'max:255'],
            'type' => ['sometimes', 'required', 'string', 'max:100'],
            'tags' => ['sometimes', 'nullable', 'array'],
            'tags.*' => ['string', 'max:100'],
            'image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'status' => ['sometimes', Rule::in(['pending', 'approved', 'rejected'])],
        ];
    }
}
