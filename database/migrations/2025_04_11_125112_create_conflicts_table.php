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
        Schema::create('conflicts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('entry1_id')->constrained('timetable_entries')->onDelete('cascade');
            $table->foreignId('entry2_id')->constrained('timetable_entries')->onDelete('cascade');
            $table->string('conflict_type'); // ROOM, LECTURER, TIME
            $table->text('description');
            $table->boolean('resolved')->default(false);
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conflicts');
    }
};
