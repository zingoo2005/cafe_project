<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    private const DEFAULT_FACTORS = [
        'Study' => ['Quiet Environment', 'Fast Wi-Fi', 'Free Wi-Fi', 'Power Outlets', 'Comfortable Seating', 'Large Study Tables'],
        'Relax' => ['Peaceful Atmosphere', 'Calm Atmosphere', 'Good Music', 'Soft Music', 'Cozy Ambience', 'Cozy Seating', 'Nice Interior'],
        'Meeting' => ['Large Tables', 'Group Tables', 'Group Seating', 'Friendly Staff', 'Friendly Environment', 'Spacious Environment', 'Easy Conversation'],
        'Dating' => ['Romantic Atmosphere', 'Beautiful Interior', 'Cozy Seating', 'Comfortable Seating', 'Good Music', 'Nice Lighting'],
        'Work' => ['Fast Wi-Fi', 'Reliable Wi-Fi', 'Power Outlets', 'Quiet Environment', 'Comfortable Seating', 'Comfortable Workspace', 'Work-Friendly Tables'],
        'Event' => ['Spacious Environment', 'Large Space', 'Group Seating', 'Beautiful Interior', 'Friendly Staff', 'Photo-Friendly Space', 'Event-Friendly Environment'],
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('status')->default('active')->index();
        });
        DB::table('users')->whereNotNull('banned_at')->update(['status' => 'suspended']);

        Schema::table('cafes', function (Blueprint $table) {
            $table->string('slug')->nullable()->unique();
            $table->string('phone', 50)->nullable();
            $table->string('website')->nullable();
            $table->softDeletes();
        });

        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->string('target_type', 80);
            $table->unsignedBigInteger('target_id');
            $table->text('reason');
            $table->text('description')->nullable();
            $table->string('status', 30)->default('pending');
            $table->timestamps();
            $table->index(['target_type', 'target_id']);
            $table->index(['status', 'created_at']);
        });
        $this->backfillReports();

        Schema::table('posts', function (Blueprint $table) {
            $table->foreignId('cafe_id')->nullable()->after('user_id')->constrained()->nullOnDelete();
            $table->softDeletes();
        });

        Schema::create('purposes', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->string('slug', 120)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('attraction_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purpose_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 150);
            $table->string('slug', 170);
            $table->boolean('is_custom')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['purpose_id', 'slug']);
            $table->index(['is_active', 'purpose_id']);
        });

        Schema::create('post_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
            $table->unique(['post_id', 'path']);
            $table->index(['post_id', 'position']);
        });

        Schema::create('post_purposes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purpose_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['post_id', 'purpose_id']);
        });

        Schema::create('post_attraction_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attraction_factor_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['post_id', 'attraction_factor_id'], 'post_factor_unique');
        });

        Schema::create('feedback', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purpose_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_suitable');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['user_id', 'post_id', 'purpose_id']);
            $table->index(['post_id', 'purpose_id', 'is_suitable']);
        });

        Schema::create('feedback_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feedback_id')->constrained('feedback')->cascadeOnDelete();
            $table->foreignId('attraction_factor_id')->constrained()->cascadeOnDelete();
            $table->boolean('agrees');
            $table->timestamps();
            $table->unique(['feedback_id', 'attraction_factor_id']);
            $table->index(['attraction_factor_id', 'agrees']);
        });

        Schema::create('favorites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cafe_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'cafe_id']);
        });

        Schema::create('bookmarks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'post_id']);
        });

        Schema::create('follows', function (Blueprint $table) {
            $table->id();
            $table->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('following_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['follower_id', 'following_id']);
            $table->index(['following_id', 'created_at']);
        });

        Schema::create('likes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'post_id']);
        });

        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('post_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->softDeletes();
            $table->index(['post_id', 'created_at']);
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('top_picks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cafe_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purpose_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('featured_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('position')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
            $table->unique(['cafe_id', 'purpose_id']);
            $table->index(['position', 'starts_at', 'ends_at']);
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->timestamps();
        });

        $this->backfillLookupData();
        $this->backfillPosts();
        $this->backfillFavorites();
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('top_picks');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('reports');
        Schema::dropIfExists('comments');
        Schema::dropIfExists('likes');
        Schema::dropIfExists('follows');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('feedback_factors');
        Schema::dropIfExists('feedback');
        Schema::dropIfExists('post_attraction_factors');
        Schema::dropIfExists('post_purposes');
        Schema::dropIfExists('post_images');
        Schema::dropIfExists('attraction_factors');
        Schema::dropIfExists('purposes');

        Schema::table('posts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('cafe_id');
            $table->dropColumn('deleted_at');
        });

        Schema::table('cafes', function (Blueprint $table) {
            $table->dropUnique(['slug']);
            $table->dropColumn(['slug', 'phone', 'website', 'deleted_at']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
    }

    private function backfillLookupData(): void
    {
        foreach (array_keys(self::DEFAULT_FACTORS) as $name) {
            DB::table('purposes')->insertOrIgnore([
                'name' => $name,
                'slug' => Str::slug($name),
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        foreach (self::DEFAULT_FACTORS as $purposeName => $factors) {
            $purposeId = DB::table('purposes')->where('slug', Str::slug($purposeName))->value('id');

            foreach (array_unique($factors) as $name) {
                DB::table('attraction_factors')->insertOrIgnore([
                    'purpose_id' => $purposeId,
                    'name' => $name,
                    'slug' => Str::slug($name),
                    'is_custom' => false,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function backfillPosts(): void
    {
        $purposeIds = DB::table('purposes')
            ->get(['id', 'name'])
            ->mapWithKeys(fn ($purpose) => [mb_strtolower($purpose->name) => $purpose->id])
            ->all();

        foreach (DB::table('posts')->orderBy('id')->get() as $post) {
            $cafeId = $post->cafe_id;
            $cafeName = trim((string) ($post->cafe_name ?? ''));

            if (! $cafeId && $cafeName !== '') {
                $cafeQuery = DB::table('cafes')->whereRaw('LOWER(name) = ?', [mb_strtolower($cafeName)]);
                if (! empty($post->township)) {
                    $cafeQuery->whereRaw('LOWER(township) = ?', [mb_strtolower($post->township)]);
                }
                $matchingCafeIds = $cafeQuery->limit(2)->pluck('id');
                $cafeId = $matchingCafeIds->count() === 1 ? $matchingCafeIds->first() : null;

                if (! $cafeId) {
                    $cafeId = DB::table('cafes')->insertGetId([
                        'user_id' => null,
                        'name' => $cafeName,
                        'township' => $post->township ?: 'Unknown',
                        'type' => 'Coffee',
                        'status' => 'pending',
                        'created_at' => $post->created_at ?? now(),
                        'updated_at' => now(),
                    ]);
                }

                DB::table('posts')->where('id', $post->id)->update(['cafe_id' => $cafeId]);
            }

            $purposeNames = $this->decodeStringArray($post->purposes ?? null);
            if ($purposeNames === [] && ! empty($post->category)) {
                $purposeNames = [$post->category];
            }

            $attachedPurposeIds = [];
            foreach ($purposeNames as $name) {
                $purposeId = $purposeIds[mb_strtolower($name)] ?? null;
                if ($purposeId) {
                    $attachedPurposeIds[] = $purposeId;
                    DB::table('post_purposes')->insertOrIgnore([
                        'post_id' => $post->id,
                        'purpose_id' => $purposeId,
                        'created_at' => $post->created_at ?? now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $factorNames = $this->decodeStringArray($post->attraction_factors ?? null);
            foreach ($factorNames as $factorName) {
                $matchingFactors = DB::table('attraction_factors')
                    ->whereIn('purpose_id', $attachedPurposeIds)
                    ->whereRaw('LOWER(name) = ?', [mb_strtolower($factorName)])
                    ->get(['id']);

                if ($matchingFactors->isEmpty()) {
                    $slug = Str::slug($factorName);
                    $factorId = DB::table('attraction_factors')
                        ->whereNull('purpose_id')
                        ->where('slug', $slug)
                        ->value('id');

                    if (! $factorId) {
                        $factorId = DB::table('attraction_factors')->insertGetId([
                            'purpose_id' => null,
                            'name' => $factorName,
                            'slug' => $slug ?: 'custom-'.Str::random(8),
                            'is_custom' => true,
                            'is_active' => true,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }

                    $factorIds = [$factorId];
                } else {
                    $factorIds = $matchingFactors->pluck('id')->all();
                }

                foreach ($factorIds as $factorId) {
                    DB::table('post_attraction_factors')->insertOrIgnore([
                        'post_id' => $post->id,
                        'attraction_factor_id' => $factorId,
                        'created_at' => $post->created_at ?? now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            $images = $this->decodeStringArray($post->images ?? null);
            if ($images === [] && ! empty($post->image)) {
                $images = [$post->image];
            }

            foreach (array_values(array_unique($images)) as $position => $path) {
                DB::table('post_images')->insertOrIgnore([
                    'post_id' => $post->id,
                    'path' => $path,
                    'position' => $position,
                    'created_at' => $post->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    private function backfillFavorites(): void
    {
        if (! Schema::hasTable('cafe_favorites')) {
            return;
        }

        foreach (DB::table('cafe_favorites')->get() as $favorite) {
            DB::table('favorites')->insertOrIgnore([
                'user_id' => $favorite->user_id,
                'cafe_id' => $favorite->cafe_id,
                'created_at' => $favorite->created_at ?? now(),
                'updated_at' => $favorite->updated_at ?? now(),
            ]);
        }
    }

    private function backfillReports(): void
    {
        if (! Schema::hasTable('post_reports')) {
            return;
        }

        foreach (DB::table('post_reports')->get() as $report) {
            DB::table('reports')->insertOrIgnore([
                'reporter_id' => $report->reporter_id,
                'target_type' => 'post',
                'target_id' => $report->post_id,
                'reason' => $report->reason,
                'description' => null,
                'status' => $report->status === 'open' ? 'pending' : $report->status,
                'created_at' => $report->created_at ?? now(),
                'updated_at' => $report->updated_at ?? now(),
            ]);
        }
    }

    private function decodeStringArray(?string $value): array
    {
        if (! $value) {
            return [];
        }

        $decoded = json_decode($value, true);

        return is_array($decoded)
            ? array_values(array_filter($decoded, fn ($item) => is_string($item) && trim($item) !== ''))
            : [];
    }
};
