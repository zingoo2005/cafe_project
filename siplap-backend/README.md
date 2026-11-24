<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Café API

The existing `/api` routes provide the full current frontend feature set. `/api/v1` currently provides authentication/profile and café directory endpoints and is being expanded module by module; the frontend uses V1 for those available modules and retains `/api` for posts, favorites, reviews, user café submissions, and admin moderation until they are migrated. Sanctum could not be downloaded because Packagist was unreachable, so the existing hashed bearer-token authentication remains in place temporarily.

Run database migrations with `php artisan migrate` and run `php artisan storage:link` to serve uploaded post and avatar images. Back up any existing database before applying migrations. Start the frontend from `C:\cafe` with `npm run dev`; set `VITE_API_URL` if the Laravel API is not at `http://127.0.0.1:8000/api`. Configure the allowed browser origins with the comma-separated `FRONTEND_ORIGINS` environment variable (the default includes Vite's ports 3000 and 5173).

### Normalized schema migration

The normalized recommendation schema adds cafe-to-post relationships, post images, purpose and attraction-factor catalogs, feedback and feedback factors, favorites, bookmarks, follows, likes, comments, generic reports, notifications, curated top picks, and settings. A follow-up migration adds purpose tags, catalog attraction factors, and user-defined custom factors to café reviews. It also adds soft deletes to cafés, posts, and comments. The migration copies existing post tags and image paths, favorites, and post reports into the normalized tables; café names on existing posts are matched to directory entries, and unmatched names are added as pending cafés. Legacy fields and tables remain so the currently implemented API continues to work while the remaining backend modules are migrated.

### Authentication

Register with `POST /api/register` or log in with `POST /api/login`, supplying `email` and `password`. Registration requires `name`, `email`, `password`, and `password_confirmation`. Both return a bearer token; send it as `Authorization: Bearer <token>` on protected endpoints. Tokens are stored as SHA-256 hashes; logging out revokes the current token, while changing a password revokes all the user's tokens.

An administrator must be promoted explicitly by an existing operator, for example in `php artisan tinker`:

```php
App\Models\User::where('email', 'admin@example.com')
    ->firstOrFail()
    ->forceFill(['role' => 'admin'])
    ->save();
```

### Endpoints

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/api/register`, `/api/login` | Public | Create an account or start a session |
| POST | `/api/logout` | Authenticated | Revoke the current token |
| GET/PATCH | `/api/me` | Authenticated | View/update name, username, bio, location, and avatar |
| DELETE | `/api/me/avatar` | Authenticated | Remove your profile photo |
| PATCH | `/api/me/password` | Authenticated | Change password and revoke tokens |
| GET | `/api/v1/users/{user}` | Public | View a privacy-safe public profile and activity counts |
| GET | `/api/v1/users/{user}/followers`, `/following` | Public | Paginate a user's social connections |
| POST/DELETE | `/api/v1/users/{user}/follow` | Authenticated | Follow or unfollow another account |
| DELETE | `/api/v1/account` | Authenticated | Permanently delete your account; requires `current_password` |
| GET | `/api/v1/admin/users` | Admin | Search/filter users by `q`, `role`, or `status` |
| GET | `/api/v1/admin/users/{user}` | Admin | View an account including moderation status |
| PATCH | `/api/v1/admin/users/{user}/role` | Admin | Set role to `user` or `admin` |
| PATCH | `/api/v1/admin/users/{user}/status` | Admin | Set status to `active` or `suspended` and revoke suspended sessions |
| GET | `/api/cafes` | Public | List approved cafés; supports `q`, `township`, `area`, `type`, `page`, `per_page` |
| GET | `/api/cafes/{cafe}` | Public | View an approved café |
| GET | `/api/v1/map/cafes` | Public | Paginated map directory of all non-deleted cafés, including pending and rejected cafés; includes review purpose tags |
| GET | `/api/v1/map/cafes` | Public | Paginated map directory of all non-deleted cafés, including pending and rejected submissions |
| POST | `/api/cafes` | Authenticated | Submit a café for approval |
| GET | `/api/my/cafes` | Authenticated | View your submissions and statuses |
| PUT/PATCH, DELETE | `/api/cafes/{cafe}` | Owner/Admin | Update or delete a café |
| GET | `/api/cafes/{cafe}/reviews` | Public | List reviews and the calculated average rating |
| GET | `/api/cafe-review-options` | Public | List active review purposes and their attraction factors |
| POST/PUT/PATCH | `/api/cafes/{cafe}/reviews` | Authenticated | Create or update a 1–5-star review with purpose IDs, factor IDs, and optional custom factors |
| DELETE | `/api/reviews/{review}` | Review author | Delete your review |
| GET | `/api/my/reviews` | Authenticated | List your café reviews |
| GET | `/api/favorites` | Authenticated | List your favorite approved cafés |
| POST/DELETE | `/api/cafes/{cafe}/favorite` | Authenticated | Add/remove a favorite |
| GET | `/api/posts` | Public | List published posts |
| GET | `/api/posts/{post}` | Public/Owner/Admin | View a published post |
| POST | `/api/posts` | Authenticated | Publish immediately; optional multipart `images[]` (up to 5 images, 5 MB each) |
| PUT/PATCH, DELETE | `/api/posts/{post}` | Owner/Admin | Edit or delete a post |
| POST | `/api/posts/{post}/reports` | Authenticated | Report a published post with a reason |
| GET | `/api/admin/users` | Admin | List users |
| PATCH | `/api/admin/users/{user}/ban` | Admin | Set `banned` to `true` or `false` |
| PATCH | `/api/admin/users/{user}/role` | Admin | Set role to `user` or `admin` |
| GET | `/api/admin/cafes/pending` | Admin | List cafés awaiting approval |
| PATCH | `/api/admin/cafes/{cafe}/approval` | Admin | Set status to `approved` or `rejected` |
| GET | `/api/admin/reports` | Admin | Review reported posts and reasons |
| PATCH | `/api/admin/posts/{post}/moderation` | Admin | Set action to `keep` or `remove`, optionally include notes |
| GET | `/api/admin/moderation/history` | Admin | View moderation actions |

User-created cafés start as pending; changes by an owner resubmit them for approval. A user can have one review per café and one report per post. Favorite and review uniqueness is also enforced by database constraints.

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
