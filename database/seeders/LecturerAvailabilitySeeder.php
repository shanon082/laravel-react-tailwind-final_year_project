<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LecturerAvailabilitySeeder extends Seeder
{
    public function run(): void
    {
        $daysOfWeek = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
        $now = Carbon::now();

        for ($lecturerId = 1; $lecturerId <= 20; $lecturerId++) {
            $availableDays = collect($daysOfWeek)->shuffle()->take(rand(1, 4));

            foreach ($availableDays as $day) {
                DB::table('lecturer_availability')->insert([
                    'lecturer_id' => $lecturerId,
                    'day' => $day,
                    'start_time' => '08:00:00',
                    'end_time' => '17:00:00',
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }
}
