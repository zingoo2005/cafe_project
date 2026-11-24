<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cafe_review_purposes', function (Blueprint $table) {
            $table->foreignId('cafe_review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('purpose_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['cafe_review_id', 'purpose_id']);
        });

        Schema::create('cafe_review_attraction_factors', function (Blueprint $table) {
            $table->foreignId('cafe_review_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attraction_factor_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            $table->primary(['cafe_review_id', 'attraction_factor_id'], 'cafe_review_factors_primary');
        });

        Schema::create('cafe_review_custom_factors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cafe_review_id')->constrained()->cascadeOnDelete();
            $table->string('name', 100);
            $table->timestamps();
            $table->unique(['cafe_review_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cafe_review_custom_factors');
        Schema::dropIfExists('cafe_review_attraction_factors');
        Schema::dropIfExists('cafe_review_purposes');
    }
};
