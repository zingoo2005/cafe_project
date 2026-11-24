<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'username' => ['sometimes', 'nullable', 'alpha_dash', 'min:3', 'max:20', 'unique:users,username'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
