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
        Schema::create('lecturer_availability', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lecturer_id')->constrained()->onDelete('cascade');
            $table->string('day'); // MONDAY, TUESDAY, etc.
            $table->time('start_time');
            $table->time('end_time');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lecturer_availability');
    }
};
