<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Settings;

class SettingsSeeder extends Seeder
{
    public function run()
    {
        // Default time slots
        $timeSlots = [
            ['start_time' => '08:00:00', 'end_time' => '10:00:00'],
            ['start_time' => '11:00:00', 'end_time' => '13:00:00'],
            ['start_time' => '14:00:00', 'end_time' => '17:00:00'],
        ];

        // Default lunch break
        $lunchBreak = [
            'start_time' => '13:00:00',
            'end_time' => '14:00:00'
        ];

        // Default settings
        $settings = [
            [
                'key' => 'time_slots',
                'value' => json_encode($timeSlots)
            ],
            [
                'key' => 'lunch_break',
                'value' => json_encode($lunchBreak)
            ],
            [
                'key' => 'academic_year',
                'value' => json_encode('2024/2025')
            ],
            [
                'key' => 'semesters',
                'value' => json_encode([
                    [
                        'name' => 'First',
                        'start_date' => '2024-08-01',
                        'end_date' => '2024-12-15',
                        'semester' => 1
                    ],
                    [
                        'name' => 'Second',
                        'start_date' => '2025-01-15',
                        'end_date' => '2025-05-30',
                        'semester' => 2
                    ],
                    [
                        'name' => 'Third',
                        'start_date' => '2025-06-15',
                        'end_date' => '2025-07-30',
                        'semester' => 3
                    ]
                ])
            ],
            [
                'key' => 'max_courses_per_day',
                'value' => json_encode(3)
            ],
            [
                'key' => 'notifications',
                'value' => json_encode([
                    'email' => true,
                    'in_app' => true
                ])
            ],
            [
                'key' => 'export_format',
                'value' => json_encode('pdf')
            ],
            [
                'key' => 'theme',
                'value' => json_encode([
                    'primary_color' => '#4B5EAA',
                    'secondary_color' => '#FF5733'
                ])
            ]
        ];

        foreach ($settings as $setting) {
            Settings::updateOrCreate(
                ['key' => $setting['key']],
                ['value' => $setting['value']]
            );
        }
    }
} 