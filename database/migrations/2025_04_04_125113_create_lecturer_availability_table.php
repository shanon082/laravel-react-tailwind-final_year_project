<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

$daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
$now = Carbon::now();

for ($lecturerId = 1; $lecturerId <= 20; $lecturerId++) {
    // Randomly choose 3 or 4 days from the week
    $availableDays = collect($daysOfWeek)->shuffle()->take(rand(3, 4));

    foreach ($availableDays as $day) {
        DB::table('lecturer_availabilities')->insert([
            'lecturer_id' => $lecturerId,
            'day' => $day,
            'start_time' => '08:00:00',
            'end_time' => '17:00:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }
}

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
