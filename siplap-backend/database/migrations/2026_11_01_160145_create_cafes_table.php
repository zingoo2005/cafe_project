
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cafes', function (Blueprint $table) {
            $table->id();

            // User who submits the cafe
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete();

            // Basic cafe information
            $table->string('name');
            $table->string('area')->nullable();
            $table->string('township');
            $table->string('street_address')->nullable();
            $table->string('type');

            // Cafe description and media
            $table->text('description')->nullable();
            $table->json('tags')->nullable();
            $table->string('image')->nullable();
            $table->decimal('rating', 2, 1)->nullable();

            // Optional map location
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // Admin approval system
            $table->enum('status', [
                'pending',
                'approved',
                'rejected'
            ])->default('pending');

            $table->timestamps();

            $table->index(['status', 'township']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafes');
    }
};
