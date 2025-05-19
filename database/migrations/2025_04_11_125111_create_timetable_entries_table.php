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
        Schema::create('timetable_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->foreignId('lecturer_id')->constrained()->onDelete('cascade');
            $table->string('day'); // MONDAY, TUESDAY, etc.
            $table->foreignId('time_slot_id')->constrained()->onDelete('cascade');
            $table->boolean('has_conflict')->default(false);
            $table->string('conflict_type')->nullable(); // ROOM, LECTURER, TIME
            $table->string('academic_year');
            $table->integer('semester');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('timetable_entries');
    }
};
