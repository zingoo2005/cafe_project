<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiTokenAuthentication
{
    public function handle(Request $request, Closure $next): Response
    {
        $plainTextToken = $request->bearerToken();

        if (! $plainTextToken) {
            return response()->json(
                $request->is('api/v1/*')
                    ? ['success' => false, 'message' => 'Unauthenticated.']
                    : ['message' => 'Unauthenticated.'],
                401
            );
        }

        $token = ApiToken::with('user')
            ->where('token', hash('sha256', $plainTextToken))
            ->first();

        if (! $token || ! $token->user || $token->user->banned_at || $token->user->status === 'suspended') {
            return response()->json(
                $request->is('api/v1/*')
                    ? ['success' => false, 'message' => 'Unauthenticated.']
                    : ['message' => 'Unauthenticated.'],
                401
            );
        }

        $token->forceFill(['last_used_at' => now()])->save();
        $request->setUserResolver(fn () => $token->user);

        return $next($request);
    }
}
