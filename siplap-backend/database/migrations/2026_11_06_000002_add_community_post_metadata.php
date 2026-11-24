<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('cafe_name')->nullable();
            $table->string('township')->nullable();
            $table->string('category')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->json('purposes')->nullable();
            $table->json('attraction_factors')->nullable();
            $table->json('images')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropColumn(['cafe_name', 'township', 'category', 'rating', 'purposes', 'attraction_factors', 'images']);
        });
    }
};
