<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PublicUserResource;
use App\Models\User;
use App\Services\Interfaces\AuthServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    public function __construct(private readonly AuthServiceInterface $auth) {}

    public function show(User $user): JsonResponse
    {
        $user->loadCount(['posts', 'reviews', 'followers', 'following']);

        return response()->json([
            'success' => true,
            'data' => new PublicUserResource($user),
        ]);
    }

    public function followers(User $user)
    {
        return PublicUserResource::collection(
            $user->followers()->withCount(['posts', 'reviews', 'followers', 'following'])->latest()->paginate(20)
        )->additional(['success' => true]);
    }

    public function following(User $user)
    {
        return PublicUserResource::collection(
            $user->following()->withCount(['posts', 'reviews', 'followers', 'following'])->latest()->paginate(20)
        )->additional(['success' => true]);
    }

    public function follow(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot follow your own account.');
        $request->user()->following()->syncWithoutDetaching([$user->id]);

        return response()->json([
            'success' => true,
            'message' => 'User followed.',
            'data' => $this->relationshipCounts($user),
        ], 201);
    }

    public function unfollow(Request $request, User $user): JsonResponse
    {
        abort_if($request->user()->is($user), 422, 'You cannot unfollow your own account.');
        $request->user()->following()->detach($user->id);

        return response()->json([
            'success' => true,
            'message' => 'User unfollowed.',
            'data' => $this->relationshipCounts($user),
        ]);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate(['current_password' => ['required', 'string']]);
        $user = $request->user();

        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $this->auth->deleteAccount($user);

        return response()->json([
            'success' => true,
            'message' => 'Account deleted.',
        ]);
    }

    private function relationshipCounts(User $user): array
    {
        return (new PublicUserResource($user->fresh()->loadCount(['followers', 'following'])))->resolve();
    }
}
