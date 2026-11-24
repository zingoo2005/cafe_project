<?php

namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Cafe;
use App\Models\Post;
use App\Models\PostReport;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function users(): JsonResponse
    {
        $users = User::latest()->paginate(20);
        $users->through(fn (User $user) => $this->userData($user));

        return response()->json(['data' => $users]);
    }

    public function setBan(Request $request, User $user): JsonResponse
    {
        abort_if(
            $request->user()->id === $user->id,
            422,
            'You cannot ban your own account.'
        );

        $data = $request->validate([
            'banned' => ['required', 'boolean'],
        ]);

        $user->forceFill([
            'banned_at' => $data['banned']
                ? ($user->banned_at ?? now())
                : null,
            'status' => $data['banned'] ? 'suspended' : 'active',
        ])->save();

        if ($data['banned']) {
            $user->apiTokens()->delete();
        }

        return response()->json([
            'message' => $data['banned'] ? 'User banned.' : 'User unbanned.',
            'data' => $this->userData($user->fresh()),
        ]);
    }

    public function setRole(Request $request, User $user): JsonResponse
    {
        abort_if(
            $request->user()->id === $user->id,
            422,
            'You cannot change your own role.'
        );

        $data = $request->validate([
            'role' => ['required', 'in:user,admin'],
        ]);

        $user->forceFill(['role' => $data['role']])->save();

        return response()->json([
            'message' => 'User role updated.',
            'data' => $this->userData($user->fresh()),
        ]);
    }

    // Pending cafes
    public function pendingCafes(): JsonResponse
    {
        return response()->json([
            'data' => Cafe::where('status', 'pending')
                ->latest()
                ->paginate(20),
        ]);
    }

    public function reviewCafe(Request $request, Cafe $cafe): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $cafe->update(['status' => $data['status']]);

        return response()->json([
            'message' => 'Cafe '.$data['status'].'.',
            'data' => $cafe->fresh(),
        ]);
    }

    // Pending community posts
    public function pendingPosts(): JsonResponse
    {
        return response()->json([
            'data' => Post::with([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ])
                ->where('status', 'pending')
                ->latest()
                ->paginate(20),
        ]);
    }

    // Community post reports
    public function reports(): JsonResponse
    {
        return response()->json([
            'data' => PostReport::with([
                'post.user:id,name',
                'reporter:id,name',
            ])
                ->latest()
                ->paginate(20),
        ]);
    }

    // Approve or reject a community post
    public function moderatePost(
        Request $request,
        Post $post
    ): JsonResponse {
        $data = $request->validate([
            'action' => ['required', 'in:approve,reject,keep,remove'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $approved = in_array(
            $data['action'],
            ['approve', 'keep'],
            true
        );

        $newStatus = $approved ? 'published' : 'rejected';

        DB::transaction(function () use (
            $request,
            $post,
            $data,
            $newStatus,
            $approved
        ) {
            $post->update(['status' => $newStatus]);

            $post->reports()
                ->where('status', 'open')
                ->update([
                    'status' => $approved ? 'kept' : 'removed',
                ]);

            DB::table('post_moderation_logs')->insert([
                'post_id' => $post->id,
                'admin_id' => $request->user()->id,
                'action' => $data['action'],
                'notes' => $data['notes'] ?? null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        });

        return response()->json([
            'message' => $approved
                ? 'Post approved successfully.'
                : 'Post rejected successfully.',
            'data' => $post->fresh()->load([
                'user:id,name',
                'cafe:id,name,township,area,status',
            ]),
        ]);
    }

    // Moderation history
    public function moderationHistory(): JsonResponse
    {
        return response()->json([
            'data' => DB::table('post_moderation_logs')
                ->leftJoin(
                    'users',
                    'post_moderation_logs.admin_id',
                    '=',
                    'users.id'
                )
                ->select(
                    'post_moderation_logs.*',
                    'users.name as admin_name'
                )
                ->latest('post_moderation_logs.created_at')
                ->paginate(20),
        ]);
    }

    private function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'banned_at' => $user->banned_at,
            'created_at' => $user->created_at,
        ];
    }
}