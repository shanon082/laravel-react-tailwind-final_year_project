<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create default admin user
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'role' => 'admin',
        ]);

        // Create some lecturers
        \App\Models\Lecturer::factory(20)->create();

        // Seed settings and lecturer availabilities
        $this->call([
            SettingsSeeder::class,
            LecturerAvailabilitySeeder::class,
        ]);
    }
}
