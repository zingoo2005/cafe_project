<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ChangePasswordRequest;
use App\Http\Requests\Api\V1\ForgotPasswordRequest;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Http\Requests\Api\V1\RegisterRequest;
use App\Http\Requests\Api\V1\ResetPasswordRequest;
use App\Http\Requests\Api\V1\UpdateProfileRequest;
use App\Http\Resources\Api\V1\UserResource;
use App\Models\User;
use App\Services\Interfaces\AuthServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class AuthController extends Controller
{
    public function __construct(private readonly AuthServiceInterface $auth) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->auth->register($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Registration successful. Verify your email to activate your account.',
            'token' => $result['token'],
            'data' => new UserResource($result['user']),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->auth->login($request->string('email')->toString(), $request->string('password')->toString());

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'token' => $result['token'],
            'data' => new UserResource($result['user']),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logout($request->bearerToken());

        return response()->json(['success' => true, 'message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new UserResource($request->user()),
        ]);
    }

    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->auth->updateProfile(
            $request->user(),
            $request->safe()->except('avatar'),
            $request->file('avatar')
        );

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data' => new UserResource($user),
        ]);
    }

    public function removeAvatar(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Profile photo removed.',
            'data' => new UserResource($this->auth->removeAvatar($request->user())),
        ]);
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $data = $request->validated();
        $this->auth->changePassword($request->user(), $data['current_password'], $data['password']);

        return response()->json(['success' => true, 'message' => 'Password changed. Please log in again.']);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->auth->requestPasswordReset($request->validated('email'));

        return response()->json([
            'success' => true,
            'message' => 'If an account exists for that email, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $status = $this->auth->resetPassword($request->validated());
        $success = $status === \Illuminate\Support\Facades\Password::PASSWORD_RESET;

        return response()->json([
            'success' => $success,
            'message' => __($status),
        ], $success ? 200 : 422);
    }

    public function sendVerification(Request $request): JsonResponse
    {
        $this->auth->sendEmailVerification($request->user());

        return response()->json(['success' => true, 'message' => 'Verification link sent if your email is not verified.']);
    }

    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        abort_unless(URL::hasValidSignature($request), 403);
        $user = User::findOrFail($id);
        $verified = $this->auth->verifyEmail($user, $hash);

        return response()->json([
            'success' => true,
            'message' => $verified ? 'Email verified.' : 'Email was already verified.',
        ]);
    }
}
