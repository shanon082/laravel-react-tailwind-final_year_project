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
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('credit_units');
            $table->foreignId('department')->constrained('departments')->onDelete('restrict');
            $table->foreignId('lecturer')->constrained('lecturers')->onDelete('restrict');
            $table->boolean('is_elective')->default(false);
            $table->integer('year_level');
            $table->integer('semester');
            $table->string('color_code');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};