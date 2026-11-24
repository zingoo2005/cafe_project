<?php

namespace App\Repositories\Implementations;

use App\Models\Cafe;
use App\Models\User;
use App\Repositories\Interfaces\CafeRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as Paginator;
use Illuminate\Support\Str;

class EloquentCafeRepository implements CafeRepositoryInterface
{
    private const MANDALAY_MAP_BOUNDS = [
        'latitude' => [21.80, 22.10],
        'longitude' => [95.95, 96.25],
    ];

    public function paginateApproved(array $filters): LengthAwarePaginator
    {
        return Cafe::query()
            ->where('status', 'approved')
            ->when($filters['q'] ?? null, function ($query, $term) {
                $query->where(function ($query) use ($term) {
                    $query->where('name', 'like', "%{$term}%")
                        ->orWhere('description', 'like', "%{$term}%")
                        ->orWhere('township', 'like', "%{$term}%")
                        ->orWhere('area', 'like', "%{$term}%")
                        ->orWhere('type', 'like', "%{$term}%");
                });
            })
            ->when($filters['township'] ?? null, fn ($query, $township) => $query->where('township', $township))
            ->when($filters['area'] ?? null, function ($query, $area) {
                $query->where(function ($query) use ($area) {
                    $query->where('area', $area)->orWhere('township', $area);
                });
            })
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->with(['posts' => fn ($query) => $query
                ->where('status', 'published')
                ->select('id', 'cafe_id', 'title', 'body', 'created_at')])
            ->withAvg('reviews', 'rating')
            ->latest()
            ->paginate($filters['per_page'] ?? 9);
    }

    public function paginateAll(array $filters): LengthAwarePaginator
    {
        return Cafe::query()
            ->when($filters['q'] ?? null, function ($query, $term) {
                $query->where(function ($query) use ($term) {
                    $query->where('name', 'like', "%{$term}%")
                        ->orWhere('township', 'like', "%{$term}%")
                        ->orWhere('area', 'like', "%{$term}%")
                        ->orWhere('type', 'like', "%{$term}%");
                });
            })
            ->when($filters['township'] ?? null, fn ($query, $township) => $query->where('township', $township))
            ->when($filters['area'] ?? null, fn ($query, $area) => $query->where('area', $area))
            ->when($filters['type'] ?? null, fn ($query, $type) => $query->where('type', $type))
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->withAvg('reviews', 'rating')
            ->latest()
            ->paginate($filters['per_page'] ?? 15);
    }

    public function paginateForMap(array $filters): LengthAwarePaginator
    {
        return Cafe::query()
            ->whereNotNull('user_id')
            ->where('status', 'approved')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', self::MANDALAY_MAP_BOUNDS['latitude'])
            ->whereBetween('longitude', self::MANDALAY_MAP_BOUNDS['longitude'])
            ->withAvg('reviews', 'rating')
            ->with('reviews.purposeTags:id,name')
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 30);
    }

    public function findApproved(Cafe $cafe): Cafe
    {
        abort_unless($cafe->status === 'approved', 404);

        return $cafe->loadAvg('reviews', 'rating')
            ->load(['posts' => fn ($query) => $query
                ->where('status', 'published')
                ->select('id', 'cafe_id', 'title', 'body', 'created_at')]);
    }

    public function paginateForUser(User $user): LengthAwarePaginator
    {
        return $user->cafes()
            ->with(['posts' => fn ($query) => $query
                ->where('status', 'published')
                ->select('id', 'cafe_id', 'title')])
            ->latest()
            ->paginate(15);
    }

    public function createForUser(User $user, array $data): Cafe
    {
        return $user->cafes()->create($data + ['status' => 'pending']);
    }

    public function update(Cafe $cafe, array $data): Cafe
    {
        $cafe->update($data);

        return $cafe->fresh();
    }

    public function delete(Cafe $cafe): void
    {
        $cafe->delete();
    }

    public function createForDirectory(array $data): Cafe
    {
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        return Cafe::create($data + ['status' => 'approved']);
    }

    public function paginateNearby(float $latitude, float $longitude, float $radiusKm, array $filters): LengthAwarePaginator
    {
        $latitudeDelta = $radiusKm / 110.574;
        $longitudeDelta = $radiusKm / max(0.01, 111.320 * cos(deg2rad($latitude)));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $perPage = min(30, max(1, (int) ($filters['per_page'] ?? 9)));

        $cafes = Cafe::query()
            ->where('status', 'approved')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereBetween('latitude', [$latitude - $latitudeDelta, $latitude + $latitudeDelta])
            ->whereBetween('longitude', [$longitude - $longitudeDelta, $longitude + $longitudeDelta])
            ->when($filters['township'] ?? null, fn ($query, $township) => $query->where('township', $township))
            ->withAvg('reviews', 'rating')
            ->get()
            ->map(function (Cafe $cafe) use ($latitude, $longitude) {
                $cafe->setAttribute('distance_km', $this->distanceInKilometers(
                    $latitude,
                    $longitude,
                    (float) $cafe->latitude,
                    (float) $cafe->longitude
                ));

                return $cafe;
            })
            ->filter(fn (Cafe $cafe) => $cafe->distance_km <= $radiusKm)
            ->sortBy('distance_km')
            ->values();

        return new Paginator(
            $cafes->forPage($page, $perPage)->values(),
            $cafes->count(),
            $perPage,
            $page,
            ['path' => Paginator::resolveCurrentPath()]
        );
    }

    private function distanceInKilometers(float $latitude, float $longitude, float $otherLatitude, float $otherLongitude): float
    {
        $latitudeDelta = deg2rad($otherLatitude - $latitude);
        $longitudeDelta = deg2rad($otherLongitude - $longitude);
        $a = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($otherLatitude)) * sin($longitudeDelta / 2) ** 2;

        return 6371 * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }
}
