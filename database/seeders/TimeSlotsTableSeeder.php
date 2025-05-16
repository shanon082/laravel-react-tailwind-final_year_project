<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TimeSlot;

class TimeSlotsTableSeeder extends Seeder
{
    public function run()
    {
        $timeSlots = [
            ['start_time' => '08:00:00', 'end_time' => '10:00:00'],
            ['start_time' => '11:00:00', 'end_time' => '13:00:00'],
            ['start_time' => '13:00:00', 'end_time' => '14:00:00'],
            ['start_time' => '14:00:00', 'end_time' => '17:00:00'],
        ];

        foreach ($timeSlots as $slot) {
            TimeSlot::create($slot);
        }
    }
}
