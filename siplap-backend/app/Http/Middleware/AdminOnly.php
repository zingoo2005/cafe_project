<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isAdmin()) {
            return response()->json(
                $request->is('api/v1/*')
                    ? ['success' => false, 'message' => 'Forbidden.']
                    : ['message' => 'Forbidden.'],
                403
            );
        }

        return $next($request);
    }
}
