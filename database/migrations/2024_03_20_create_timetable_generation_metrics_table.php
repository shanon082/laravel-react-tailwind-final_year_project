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
        Schema::create('timetable_generation_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('job_id')->unique();
            $table->string('method')->default('unknown');
            $table->float('duration_seconds')->default(0);
            $table->boolean('success')->default(false);
            $table->integer('entries_generated')->default(0);
            $table->integer('conflicts_count')->default(0);
            $table->text('error_message')->nullable();
            $table->string('academic_year')->nullable();
            $table->integer('semester')->nullable();
            $table->timestamps();

            $table->index(['method', 'success']);
            $table->index(['academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_generation_metrics');
    }
}; 