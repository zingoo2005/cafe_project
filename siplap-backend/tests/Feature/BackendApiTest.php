<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\AttractionFactor;
use App\Models\Cafe;
use App\Models\Feedback;
use App\Models\FeedbackFactor;
use App\Models\Post;
use App\Models\Purpose;
use App\Models\User;
use Database\Seeders\PurposeSeeder;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class BackendApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_profile_and_logout_use_bearer_tokens(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Cafe Fan',
            'email' => 'fan@example.com',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'role' => 'admin',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.role', 'user');
        $token = $response->json('token');

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'fan@example.com');

        $this->withToken($token)->getJson('/api/v1/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'fan@example.com');
        $this->getJson('/api/v1/cafes')->assertOk();

        $this->withToken($token)->patchJson('/api/me', ['username' => 'cafefan'])
            ->assertOk()
            ->assertJsonPath('data.username', 'cafefan');

        $this->withToken($token)->postJson('/api/logout')->assertOk();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
        $this->assertDatabaseMissing('api_tokens', ['token' => hash('sha256', $token)]);
    }

    public function test_cafes_require_approval_and_can_be_favorited_and_reviewed(): void
    {
        $this->seed(PurposeSeeder::class);
        $owner = User::factory()->create();
        $ownerToken = $this->tokenFor($owner);

        $created = $this->withToken($ownerToken)->postJson('/api/cafes', [
            'name' => 'Corner Cup',
            'township' => 'Downtown',
            'type' => 'Coffee',
        ])->assertCreated()->assertJsonPath('data.status', 'pending');
        $cafeId = $created->json('data.id');

        $this->getJson('/api/cafes')->assertOk()->assertJsonMissing(['name' => 'Corner Cup']);
        $this->getJson("/api/cafes/{$cafeId}")->assertNotFound();

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/cafes/{$cafeId}/approval", ['status' => 'approved'])
            ->assertOk();
        $this->getJson('/api/cafes?q=Corner')->assertOk()->assertJsonPath('data.0.id', $cafeId);
        $this->getJson('/api/cafes?area=Downtown')->assertOk()->assertJsonPath('meta.total', 1);
        $this->getJson('/api/cafes?q=not-found')->assertOk()->assertJsonPath('meta.total', 0);

        $user = User::factory()->create();
        $userToken = $this->tokenFor($user);
        $this->withToken($userToken)->postJson("/api/cafes/{$cafeId}/favorite")->assertCreated();
        $this->withToken($userToken)->postJson("/api/cafes/{$cafeId}/favorite")->assertCreated();
        $this->assertDatabaseCount('cafe_favorites', 1);
        $this->withToken($userToken)->getJson('/api/favorites')
            ->assertOk()
            ->assertJsonPath('data.total', 1);

        $study = Purpose::where('name', 'Study')->firstOrFail();
        $studyFactor = AttractionFactor::where('purpose_id', $study->id)->firstOrFail();
        $this->withToken($userToken)->postJson("/api/cafes/{$cafeId}/reviews", [
            'rating' => 5,
            'body' => 'Excellent coffee.',
            'purpose_ids' => [$study->id],
            'attraction_factor_ids' => [$studyFactor->id],
        ])->assertCreated();
        $this->withToken($userToken)->postJson("/api/cafes/{$cafeId}/reviews", [
            'rating' => 4,
            'purpose_ids' => [$study->id],
            'attraction_factor_ids' => [$studyFactor->id],
        ])->assertStatus(409);
        $this->assertDatabaseHas('cafes', ['id' => $cafeId, 'rating' => 5]);
        $this->getJson("/api/cafes/{$cafeId}/reviews")
            ->assertOk()
            ->assertJsonPath('rating', 5);
        $this->withToken($userToken)->getJson('/api/my/reviews')->assertOk()->assertJsonPath('data.total', 1);
        $this->withToken($userToken)->getJson("/api/cafes/{$cafeId}/my-review")
            ->assertOk()
            ->assertJsonPath('data.rating', 5);

        $this->withToken($ownerToken)->patchJson("/api/cafes/{$cafeId}", [
            'description' => 'Updated café details.',
        ])->assertOk()->assertJsonPath('data.status', 'pending');
    }

    public function test_discover_cafe_records_include_their_published_community_posts(): void
    {
        $cafe = Cafe::factory()->create(['status' => 'approved']);
        $publishedPost = Post::factory()->create([
            'cafe_id' => $cafe->id,
            'status' => 'published',
            'title' => 'A community recommendation',
        ]);
        Post::factory()->create([
            'cafe_id' => $cafe->id,
            'status' => 'removed',
            'title' => 'A removed post',
        ]);

        $this->getJson('/api/v1/cafes')
            ->assertOk()
            ->assertJsonPath('data.0.id', $cafe->id)
            ->assertJsonPath('data.0.community_posts.0.id', $publishedPost->id)
            ->assertJsonPath('data.0.community_posts.0.title', 'A community recommendation')
            ->assertJsonMissing(['title' => 'A removed post']);

        $this->getJson("/api/v1/cafes/{$cafe->id}")
            ->assertOk()
            ->assertJsonPath('data.community_posts.0.id', $publishedPost->id);
    }

    public function test_users_can_review_pending_cafes_referenced_by_community_posts(): void
    {
        $this->seed(PurposeSeeder::class);
        $owner = User::factory()->create();
        $cafe = $this->withToken($this->tokenFor($owner))
            ->postJson('/api/cafes', [
                'name' => 'Pending Community Café',
                'township' => 'Downtown',
                'type' => 'Coffee',
            ])->assertCreated()
            ->assertJsonPath('data.status', 'pending');
        $cafeId = $cafe->json('data.id');

        $this->getJson('/api/cafes')->assertOk()->assertJsonMissing(['name' => 'Pending Community Café']);
        $this->getJson('/api/cafe-review-targets?name=Pending%20Community%20Caf%C3%A9')
            ->assertOk()
            ->assertJsonPath('data.0.id', $cafeId)
            ->assertJsonPath('data.0.status', 'pending');

        $this->getJson('/api/cafe-review-options')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'Dating');
        $study = Purpose::where('name', 'Study')->firstOrFail();
        $relax = Purpose::where('name', 'Relax')->firstOrFail();
        $studyFactor = AttractionFactor::where('purpose_id', $study->id)->firstOrFail();
        $relaxFactor = AttractionFactor::where('purpose_id', $relax->id)->firstOrFail();
        $reviewerToken = $this->tokenFor(User::factory()->create());
        $this->withToken($reviewerToken)->postJson("/api/cafes/{$cafeId}/reviews", [
            'rating' => 5,
            'body' => 'I found this café from a community post.',
            'purpose_ids' => [$study->id, $relax->id],
            'attraction_factor_ids' => [$studyFactor->id, $relaxFactor->id],
            'custom_factors' => ['Friendly neighborhood'],
        ])->assertCreated();
        $this->getJson("/api/cafes/{$cafeId}/reviews")
            ->assertOk()
            ->assertJsonPath('review_count', 1)
            ->assertJsonPath('data.data.0.body', 'I found this café from a community post.')
            ->assertJsonPath('data.data.0.purpose_tags.0.id', $study->id)
            ->assertJsonPath('data.data.0.attraction_factors.0.id', $studyFactor->id)
            ->assertJsonPath('data.data.0.custom_factors.0.name', 'Friendly neighborhood');
        $this->withToken($reviewerToken)->getJson("/api/cafes/{$cafeId}/my-review")
            ->assertOk()
            ->assertJsonPath('data.purpose_tags.0.id', $study->id)
            ->assertJsonPath('data.attraction_factors.0.id', $studyFactor->id);
        $this->withToken($reviewerToken)->getJson('/api/my/reviews')
            ->assertOk()
            ->assertJsonPath('data.data.0.custom_factors.0.name', 'Friendly neighborhood');
        $this->assertDatabaseCount('cafe_review_purposes', 2);
        $this->assertDatabaseCount('cafe_review_attraction_factors', 2);

        $this->withToken($this->tokenFor(User::factory()->create()))
            ->postJson("/api/cafes/{$cafeId}/reviews", [
                'rating' => 4,
                'purpose_ids' => [$relax->id],
                'attraction_factor_ids' => [$studyFactor->id],
            ])->assertUnprocessable();

        $this->withToken($reviewerToken)->patchJson("/api/cafes/{$cafeId}/reviews", [
            'rating' => 4,
            'purpose_ids' => [$study->id],
            'attraction_factor_ids' => [$studyFactor->id],
            'custom_factors' => [],
        ])->assertOk()
            ->assertJsonPath('data.purpose_tags.0.id', $study->id)
            ->assertJsonPath('data.custom_factors', []);
        $this->assertDatabaseCount('cafe_review_purposes', 1);
        $this->assertDatabaseCount('cafe_review_custom_factors', 0);

        $this->withToken($this->tokenFor(User::factory()->create()))
            ->postJson("/api/cafes/{$cafeId}/reviews", ['rating' => 4])
            ->assertUnprocessable();

        $cafeModel = Cafe::findOrFail($cafeId);
        $cafeModel->update(['status' => 'rejected']);
        $this->getJson("/api/cafes/{$cafeId}/reviews")->assertNotFound();
        $this->withToken($this->tokenFor(User::factory()->create()))
            ->postJson("/api/cafes/{$cafeId}/reviews", ['rating' => 4])
            ->assertNotFound();
    }

    public function test_post_reporting_and_admin_moderation_are_recorded(): void
    {
        $author = User::factory()->create();
        $post = Post::create([
            'user_id' => $author->id,
            'title' => 'Community post',
            'body' => 'Post content',
        ]);
        $reporter = User::factory()->create();

        $this->withToken($this->tokenFor($reporter))
            ->postJson("/api/posts/{$post->id}/reports", ['reason' => 'This appears to be spam.'])
            ->assertCreated();

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/posts/{$post->id}/moderation", [
                'action' => 'remove',
                'notes' => 'Confirmed spam.',
            ])
            ->assertOk();

        $this->assertDatabaseHas('posts', ['id' => $post->id, 'status' => 'removed']);
        $this->assertDatabaseHas('post_reports', ['post_id' => $post->id, 'status' => 'removed']);
        $this->assertDatabaseHas('post_moderation_logs', [
            'post_id' => $post->id,
            'admin_id' => $admin->id,
            'action' => 'remove',
        ]);
        $this->getJson('/api/admin/reports')->assertOk()->assertJsonPath('data.total', 1);
        $this->getJson('/api/admin/moderation/history')->assertOk()->assertJsonPath('data.total', 1);
    }

    public function test_banned_users_are_denied_even_with_an_existing_token(): void
    {
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $user = User::factory()->create();
        $token = $this->tokenFor($user);

        $this->withToken($this->tokenFor($admin))
            ->patchJson("/api/admin/users/{$user->id}/ban", ['banned' => true])
            ->assertOk();

        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_v1_user_profiles_follows_account_deletion_and_admin_status_are_available(): void
    {
        $user = User::factory()->create();
        $target = User::factory()->create([
            'name' => 'Public Profile',
            'email' => 'private@example.com',
        ]);
        $token = $this->tokenFor($user);

        $this->getJson("/api/v1/users/{$target->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $target->id)
            ->assertJsonPath('data.followers_count', 0)
            ->assertJsonMissing(['email' => 'private@example.com']);

        $this->withToken($token)->postJson("/api/v1/users/{$target->id}/follow")
            ->assertCreated()
            ->assertJsonPath('data.followers_count', 1);
        $this->assertDatabaseHas('follows', [
            'follower_id' => $user->id,
            'following_id' => $target->id,
        ]);
        $this->getJson("/api/v1/users/{$target->id}/followers")
            ->assertOk()
            ->assertJsonPath('data.0.id', $user->id);
        $this->withToken($token)->deleteJson("/api/v1/users/{$target->id}/follow")
            ->assertOk()
            ->assertJsonPath('data.followers_count', 0);
        $this->withToken($token)->postJson("/api/v1/users/{$user->id}/follow")
            ->assertUnprocessable();

        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $adminToken = $this->tokenFor($admin);
        $this->withToken($adminToken)->getJson('/api/v1/admin/users?q=Public')
            ->assertOk()
            ->assertJsonPath('data.0.id', $target->id);
        $this->withToken($adminToken)->patchJson("/api/v1/admin/users/{$target->id}/status", ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended')
            ->assertJsonPath('data.banned_at', fn ($value) => $value !== null);
        $this->withToken($adminToken)->patchJson("/api/v1/admin/users/{$target->id}/role", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin');
        $this->withToken($adminToken)->patchJson("/api/v1/admin/users/{$admin->id}/status", ['status' => 'suspended'])
            ->assertUnprocessable();

        $deletable = User::factory()->create();
        $deletableToken = $this->tokenFor($deletable);
        $this->withToken($deletableToken)->deleteJson('/api/v1/account', ['current_password' => 'password'])
            ->assertOk()
            ->assertJsonPath('success', true);
        $this->assertDatabaseMissing('users', ['id' => $deletable->id]);
        $this->withToken($deletableToken)->getJson('/api/v1/me')->assertUnauthorized();
    }

    public function test_profile_and_community_posts_are_saved_through_the_api(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $this->tokenFor($user);

        $this->withToken($token)->patchJson('/api/me', [
            'name' => 'Updated Name',
            'bio' => 'Coffee enthusiast',
            'location' => 'Mandalay',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.bio', 'Coffee enthusiast');

        $post = $this->withToken($token)->postJson('/api/posts', [
            'title' => 'A good place to work',
            'cafe_name' => 'Corner Cup',
            'township' => 'Chanayethazan',
            'body' => 'The Wi-Fi and coffee were both great.',
            'category' => 'Work',
            'rating' => 5,
            'attraction_factors' => ['Fast Wi-Fi', 'Power Outlets'],
        ])->assertCreated()
            ->assertJsonPath('data.cafe_name', 'Corner Cup')
            ->assertJsonPath('data.attraction_factors.0', 'Fast Wi-Fi')
            ->assertJsonPath('data.cafe.name', 'Corner Cup')
            ->assertJsonPath('data.cafe.township', 'Chanayethazan')
            ->assertJsonPath('data.cafe.status', 'pending');

        $postId = $post->json('data.id');
        $cafeId = $post->json('data.cafe_id');
        $this->assertDatabaseHas('cafes', [
            'id' => $cafeId,
            'user_id' => $user->id,
            'name' => 'Corner Cup',
            'township' => 'Chanayethazan',
            'status' => 'pending',
        ]);
        $this->getJson('/api/posts')->assertOk()->assertJsonPath('data.data.0.id', $postId);
        $this->withToken($token)->getJson('/api/my/cafes')
            ->assertOk()
            ->assertJsonPath('data.data.0.posts.0.id', $postId);
        $this->withToken($token)->patchJson("/api/posts/{$postId}", [
            'body' => 'Updated community post content.',
        ])->assertOk()->assertJsonPath('data.body', 'Updated community post content.');
        $this->withToken($token)->deleteJson("/api/posts/{$postId}")->assertOk();
    }

    public function test_community_posts_reuse_matching_user_submitted_cafes(): void
    {
        $user = User::factory()->create();
        $cafe = $user->cafes()->create([
            'name' => 'Corner Cup',
            'township' => 'Chanayethazan',
            'type' => 'Coffee',
            'status' => 'pending',
        ]);

        $post = $this->withToken($this->tokenFor($user))->postJson('/api/posts', [
            'title' => 'A good place to work',
            'cafe_name' => ' corner cup ',
            'township' => 'CHANAYETHAZAN',
            'body' => 'The Wi-Fi and coffee were both great.',
        ])->assertCreated()
            ->assertJsonPath('data.cafe_id', $cafe->id)
            ->assertJsonPath('data.cafe.id', $cafe->id);

        $this->assertDatabaseCount('cafes', 1);
        $this->assertDatabaseHas('posts', [
            'id' => $post->json('data.id'),
            'cafe_id' => $cafe->id,
        ]);
    }

    public function test_api_allows_the_configured_frontend_origin(): void
    {
        $this->getJson('/api/cafes', ['Origin' => 'http://localhost:3000'])
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
    }

    public function test_post_and_profile_image_uploads_are_saved_to_public_storage(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $token = $this->tokenFor($user);
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lJkAAAAASUVORK5CYII=');

        $post = $this->withToken($token)->post('/api/posts', [
            'title' => 'Photo post',
            'body' => 'Post with a photo.',
            'images' => [UploadedFile::fake()->createWithContent('cafe.png', $png)],
        ], ['Accept' => 'application/json'])->assertCreated();
        $postImage = $post->json('data.image');
        $this->assertNotEmpty($postImage);
        Storage::disk('public')->assertExists($postImage);

        $profile = $this->withToken($token)->post('/api/me', [
            '_method' => 'PATCH',
            'avatar' => UploadedFile::fake()->createWithContent('avatar.png', $png),
        ], ['Accept' => 'application/json'])->assertOk();
        $avatar = $profile->json('data.avatar');
        $this->assertNotEmpty($avatar);
        Storage::disk('public')->assertExists($avatar);
    }

    public function test_normalized_recommendation_models_have_the_expected_relationships(): void
    {
        $this->seed(PurposeSeeder::class);

        $user = User::factory()->create();
        $cafe = Cafe::factory()->create();
        $post = Post::factory()->create([
            'user_id' => $user->id,
            'cafe_id' => $cafe->id,
        ]);
        $purpose = Purpose::where('name', 'Study')->firstOrFail();
        $factor = AttractionFactor::where('purpose_id', $purpose->id)->firstOrFail();

        $post->purposeTags()->attach($purpose);
        $post->attractionFactors()->attach($factor);
        $feedback = Feedback::factory()->create([
            'user_id' => $user->id,
            'post_id' => $post->id,
            'purpose_id' => $purpose->id,
            'is_suitable' => true,
        ]);
        $feedbackFactor = FeedbackFactor::create([
            'feedback_id' => $feedback->id,
            'attraction_factor_id' => $factor->id,
            'agrees' => true,
        ]);

        $this->assertSame($cafe->id, $post->fresh()->cafe->id);
        $this->assertSame([$purpose->id], $post->fresh()->purposeTags->pluck('id')->all());
        $this->assertSame([$factor->id], $post->fresh()->attractionFactors->pluck('id')->all());
        $this->assertTrue($feedbackFactor->fresh()->feedback->is_suitable);
        $this->assertSame($user->id, $cafe->fresh()->posts->first()->user_id);
    }

    public function test_normalized_migration_backfills_legacy_post_metadata_favorites_and_reports(): void
    {
        $migration = require database_path('migrations/2026_11_06_000005_create_normalized_recommendation_schema.php');
        $migration->down();

        $user = User::factory()->create();
        $now = now();
        $cafeId = DB::table('cafes')->insertGetId([
            'user_id' => $user->id,
            'name' => 'Legacy Cup',
            'township' => 'Old Town',
            'type' => 'Coffee',
            'status' => 'approved',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $postId = DB::table('posts')->insertGetId([
            'user_id' => $user->id,
            'title' => 'Legacy recommendation',
            'body' => 'Legacy post body.',
            'image' => 'posts/legacy-first.png',
            'status' => 'published',
            'cafe_name' => 'Legacy Cup',
            'township' => 'Old Town',
            'category' => 'Study',
            'rating' => 5,
            'purposes' => json_encode(['Study', 'Relax']),
            'attraction_factors' => json_encode(['Fast Wi-Fi', 'My custom factor']),
            'images' => json_encode(['posts/legacy-first.png', 'posts/legacy-second.png']),
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('cafe_favorites')->insert([
            'user_id' => $user->id,
            'cafe_id' => $cafeId,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        DB::table('post_reports')->insert([
            'post_id' => $postId,
            'reporter_id' => $user->id,
            'reason' => 'Legacy report reason',
            'status' => 'open',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->assertDatabaseHas('post_reports', ['post_id' => $postId, 'reporter_id' => $user->id]);

        $migration->up();
        $post = DB::table('posts')->where('id', $postId)->first();
        $this->assertSame($cafeId, $post->cafe_id);
        $this->assertDatabaseCount('post_purposes', 2);
        $this->assertDatabaseCount('post_attraction_factors', 2);
        $this->assertDatabaseCount('post_images', 2);
        $this->assertDatabaseHas('favorites', ['user_id' => $user->id, 'cafe_id' => $cafeId]);
        $this->assertDatabaseHas('reports', [
            'target_type' => 'post',
            'target_id' => $postId,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('attraction_factors', [
            'name' => 'My custom factor',
            'is_custom' => true,
        ]);
    }

    public function test_v1_auth_profile_and_password_flows_use_resources_and_services(): void
    {
        Notification::fake();
        $this->postJson('/api/v1/register', [])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Validation failed.');

        $registered = $this->postJson('/api/v1/register', [
            'name' => 'Versioned User',
            'email' => 'versioned@example.com',
            'username' => 'versioned_user',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
            'role' => 'admin',
        ])->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.role', 'user')
            ->assertJsonMissingPath('data.password');

        $user = User::where('email', 'versioned@example.com')->firstOrFail();
        Notification::assertSentTo($user, VerifyEmail::class);
        $token = $registered->json('token');

        Storage::fake('public');
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lJkAAAAASUVORK5CYII=');
        $avatar = $this->withToken($token)->post('/api/v1/profile/avatar', [
            'avatar' => UploadedFile::fake()->createWithContent('avatar.png', $png),
        ], ['Accept' => 'application/json'])->assertOk()
            ->json('data.avatar');
        $this->assertNotEmpty($avatar);
        Storage::disk('public')->assertExists($avatar);

        $this->withToken($token)->putJson('/api/v1/profile', [
            'name' => 'Updated Versioned User',
            'email' => 'versioned-new@example.com',
            'bio' => 'Coffee fan',
        ])->assertOk()
            ->assertJsonPath('data.name', 'Updated Versioned User')
            ->assertJsonPath('data.email', 'versioned-new@example.com')
            ->assertJsonPath('data.email_verified_at', null);

        $this->withToken($token)->putJson('/api/v1/change-password', [
            'current_password' => 'StrongPass123!',
            'password' => 'AnotherStrongPass123!',
            'password_confirmation' => 'AnotherStrongPass123!',
        ])->assertOk();
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();

        $this->postJson('/api/v1/login', [
            'email' => 'versioned-new@example.com',
            'password' => 'AnotherStrongPass123!',
        ])->assertOk()->assertJsonPath('success', true);
    }

    public function test_v1_password_reset_and_signed_email_verification_work(): void
    {
        Notification::fake();
        $user = User::factory()->unverified()->create();
        $token = $this->tokenFor($user);

        $this->postJson('/api/v1/forgot-password', ['email' => $user->email])
            ->assertOk()
            ->assertJsonPath('success', true);

        $resetToken = null;
        Notification::assertSentTo($user, ResetPassword::class, function ($notification) use (&$resetToken) {
            $resetToken = $notification->token;

            return true;
        });

        $this->postJson('/api/v1/reset-password', [
            'token' => $resetToken,
            'email' => $user->email,
            'password' => 'ResetPass123!',
            'password_confirmation' => 'ResetPass123!',
        ])->assertOk()->assertJsonPath('success', true);
        $this->withToken($token)->getJson('/api/v1/me')->assertUnauthorized();

        $user->refresh();
        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(30),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())]
        );
        $this->getJson($verificationUrl)
            ->assertOk()
            ->assertJsonPath('success', true);
        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->getJson('/api/v1/cafes/999999')
            ->assertNotFound()
            ->assertJsonPath('data', null);
    }

    public function test_v1_cafe_directory_is_admin_managed_and_nearby_search_returns_distance(): void
    {
        $this->seed(PurposeSeeder::class);
        $admin = User::factory()->create();
        $admin->forceFill(['role' => 'admin'])->save();
        $adminToken = $this->tokenFor($admin);

        $cafe = $this->withToken($adminToken)->postJson('/api/v1/admin/cafes', [
            'name' => 'Versioned Corner Cup',
            'township' => 'Downtown',
            'type' => 'Coffee',
            'latitude' => 21.9800,
            'longitude' => 96.0900,
            'status' => 'approved',
        ])->assertCreated()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.slug', 'versioned-corner-cup');

        $cafeId = $cafe->json('data.id');
        $this->getJson('/api/v1/cafes?q=Versioned%20Corner')
            ->assertOk()
            ->assertJsonPath('data.0.id', $cafeId)
            ->assertJsonPath('meta.has_more', false);
        $pendingCafe = Cafe::factory()->pending()->create([
            'name' => 'Pending Map Café',
            'latitude' => 21.981,
            'longitude' => 96.091,
            'township' => 'Chanayethazan',
        ]);
        $rejectedCafe = Cafe::factory()->create([
            'name' => 'Rejected Map Café',
            'status' => 'rejected',
            'latitude' => 21.981,
            'longitude' => 96.091,
        ]);
        $outsideMandalayCafe = Cafe::factory()->create([
            'name' => 'Outside Mandalay Café',
            'latitude' => 22.2,
            'longitude' => 96.091,
        ]);
        $unlocatedCafe = Cafe::factory()->create([
            'name' => 'Unlocated Café',
            'latitude' => null,
            'longitude' => null,
        ]);
        Cafe::factory()->create([
            'name' => 'Second Located Mandalay Café',
            'latitude' => 21.99,
            'longitude' => 96.10,
        ]);
        $submittedCafe = Cafe::factory()->create([
            'name' => 'User Submitted Mandalay Café',
            'township' => 'Chanayethazan',
            'latitude' => 21.982,
            'longitude' => 96.092,
        ]);
        $review = $submittedCafe->reviews()->create([
            'user_id' => $admin->id,
            'rating' => 5,
        ]);
        $study = Purpose::where('name', 'Study')->firstOrFail();
        $review->purposeTags()->attach($study);
        $mapResponse = $this->getJson('/api/v1/map/cafes?per_page=30')
            ->assertOk()
            ->assertJsonPath('meta.has_more', false)
            ->assertJsonFragment(['id' => $submittedCafe->id, 'status' => 'approved'])
            ->assertJsonMissing(['id' => $pendingCafe->id])
            ->assertJsonMissing(['id' => $rejectedCafe->id])
            ->assertJsonMissing(['id' => $outsideMandalayCafe->id])
            ->assertJsonMissing(['id' => $unlocatedCafe->id])
            ->assertJsonFragment(['id' => $study->id, 'name' => 'Study']);
        $this->assertNotContains(
            $cafeId,
            array_column($mapResponse->json('data'), 'id'),
            'Admin-created directory cafés must not appear on the community map.'
        );
        $this->getJson('/api/v1/cafes')
            ->assertOk()
            ->assertJsonMissing(['name' => 'Pending Map Café'])
            ->assertJsonMissing(['name' => 'Rejected Map Café']);

        Cafe::factory()->create(['latitude' => null, 'longitude' => null]);
        $this->getJson('/api/v1/cafes?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.has_more', true);
        $this->getJson('/api/v1/map/cafes?per_page=1')
            ->assertOk()
            ->assertJsonPath('meta.has_more', true);
        $this->getJson('/api/v1/cafes/nearby?latitude=21.98&longitude=96.09&radius_km=1')
            ->assertOk()
            ->assertJsonPath('data.0.id', $cafeId)
            ->assertJsonPath('data.0.distance_km', 0);

        $userToken = $this->tokenFor(User::factory()->create());
        $this->withToken($userToken)->postJson('/api/v1/admin/cafes', [
            'name' => 'Not Authorized',
            'township' => 'Downtown',
            'type' => 'Coffee',
        ])->assertForbidden();

        $this->withToken($adminToken)->patchJson("/api/v1/admin/cafes/{$cafeId}", [
            'phone' => '+1 555 555 0100',
        ])->assertOk()->assertJsonPath('data.phone', '+1 555 555 0100');
    }

    private function tokenFor(User $user): string
    {
        $plainTextToken = bin2hex(random_bytes(32));
        ApiToken::create([
            'user_id' => $user->id,
            'token' => hash('sha256', $plainTextToken),
            'name' => 'test',
        ]);

        return $plainTextToken;
    }
}
