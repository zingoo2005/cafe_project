<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $data = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:255'],
            'role' => ['sometimes', 'in:user,admin'],
            'status' => ['sometimes', 'in:active,suspended'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $users = User::query()
            ->when($data['q'] ?? null, function ($query, string $search) {
                $query->where(function ($query) use ($search) {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%");
                });
            })
            ->when($data['role'] ?? null, fn ($query, string $role) => $query->where('role', $role))
            ->when($data['status'] ?? null, fn ($query, string $status) => $query->where('status', $status))
            ->latest()
            ->paginate($data['per_page'] ?? 20);

        return AdminUserResource::collection($users)->additional(['success' => true]);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new AdminUserResource($user),
        ]);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot change your own role.');
        $data = $request->validate(['role' => ['required', 'in:user,admin']]);
        $user->forceFill(['role' => $data['role']])->save();

        return response()->json([
            'success' => true,
            'message' => 'User role updated.',
            'data' => new AdminUserResource($user->fresh()),
        ]);
    }

    public function updateStatus(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot change your own status.');
        $data = $request->validate(['status' => ['required', 'in:active,suspended']]);
        $suspended = $data['status'] === 'suspended';
        $user->forceFill([
            'status' => $data['status'],
            'banned_at' => $suspended ? ($user->banned_at ?? now()) : null,
        ])->save();

        if ($suspended) {
            $user->apiTokens()->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $suspended ? 'User suspended.' : 'User activated.',
            'data' => new AdminUserResource($user->fresh()),
        ]);
    }
}
