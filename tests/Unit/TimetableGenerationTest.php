<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\TimetableOptimizer;
use App\Services\AI\PredictiveAnalytics;
use App\Jobs\GenerateTimetableJob;
use App\Models\Course;
use App\Models\Room;
use App\Models\Lecturer;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Models\LecturerAvailability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TimetableGenerationTest extends TestCase
{
    use RefreshDatabase;

    protected $optimizer;
    protected $analytics;
    protected $testData;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->optimizer = new TimetableOptimizer();
        $this->analytics = new PredictiveAnalytics();
        
        // Create test data
        $this->createTestData();
    }

    protected function createTestData()
    {
        // Create test courses
        $courses = Course::factory()->count(5)->create();
        
        // Create test rooms
        $rooms = Room::factory()->count(3)->create([
            'capacity' => 50
        ]);
        
        // Create test lecturers
        $lecturers = Lecturer::factory()->count(3)->create();
        
        // Create time slots
        $timeSlots = [];
        $startTimes = ['09:00', '11:00', '14:00', '16:00'];
        foreach ($startTimes as $i => $start) {
            $timeSlots[] = TimeSlot::create([
                'start_time' => $start,
                'end_time' => date('H:i', strtotime($start) + 7200), // 2 hours duration
            ]);
        }
        
        // Create lecturer availability
        foreach ($lecturers as $lecturer) {
            foreach (['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as $day) {
                LecturerAvailability::create([
                    'lecturer_id' => $lecturer->id,
                    'day' => $day,
                    'start_time' => '09:00',
                    'end_time' => '17:00'
                ]);
            }
        }
        
        $this->testData = [
            'courses' => $courses,
            'rooms' => $rooms,
            'lecturers' => $lecturers,
            'timeSlots' => $timeSlots,
            'academic_year' => '2023/2024',
            'semester' => 'First'
        ];
    }

    public function test_genetic_algorithm_generates_valid_timetable()
    {
        $schedule = $this->optimizer->generateUsingGeneticAlgorithm([
            'courses' => $this->testData['courses'],
            'rooms' => $this->testData['rooms'],
            'lecturers' => $this->testData['lecturers'],
            'timeSlots' => $this->testData['timeSlots']
        ]);
        
        $this->assertNotEmpty($schedule);
        $this->assertValidSchedule($schedule);
    }

    public function test_ai_optimizer_integration()
    {
        Http::fake([
            config('services.ai_optimizer.url') => Http::response([
                // Mock successful AI response
                'schedule' => []
            ], 200)
        ]);
        
        $job = new GenerateTimetableJob([
            'academic_year' => $this->testData['academic_year'],
            'semester' => $this->testData['semester'],
            'courses' => $this->testData['courses'],
            'rooms' => $this->testData['rooms'],
            'lecturers' => $this->testData['lecturers']
        ]);
        
        $job->handle();
        
        Http::assertSent(function ($request) {
            return $request->url() == config('services.ai_optimizer.url');
        });
    }

    public function test_ai_optimizer_fallback_to_genetic_algorithm()
    {
        Http::fake([
            config('services.ai_optimizer.url') => Http::response([], 500)
        ]);
        
        $job = new GenerateTimetableJob([
            'academic_year' => $this->testData['academic_year'],
            'semester' => $this->testData['semester'],
            'courses' => $this->testData['courses'],
            'rooms' => $this->testData['rooms'],
            'lecturers' => $this->testData['lecturers']
        ]);
        
        $job->handle();
        
        $this->assertDatabaseHas('timetable_entries', [
            'academic_year' => $this->testData['academic_year'],
            'semester' => $this->testData['semester']
        ]);
    }

    public function test_predictive_analytics()
    {
        // Create some historical data
        foreach ($this->testData['courses'] as $course) {
            TimetableEntry::create([
                'course_id' => $course->id,
                'room_id' => $this->testData['rooms'][0]->id,
                'lecturer_id' => $this->testData['lecturers'][0]->id,
                'day' => 'MONDAY',
                'time_slot_id' => $this->testData['timeSlots'][0]->id,
                'academic_year' => '2022/2023',
                'semester' => 'First'
            ]);
        }
        
        $analysis = $this->analytics->analyzeHistoricalPatterns();
        
        $this->assertArrayHasKey('room_utilization', $analysis);
        $this->assertArrayHasKey('peak_hours', $analysis);
        $this->assertArrayHasKey('course_patterns', $analysis);
        $this->assertArrayHasKey('lecturer_preferences', $analysis);
    }

    public function test_conflict_detection()
    {
        $schedule = $this->optimizer->generateUsingGeneticAlgorithm([
            'courses' => $this->testData['courses'],
            'rooms' => $this->testData['rooms'],
            'lecturers' => $this->testData['lecturers'],
            'timeSlots' => $this->testData['timeSlots']
        ]);
        
        foreach ($schedule as $entry) {
            TimetableEntry::create(array_merge($entry, [
                'academic_year' => $this->testData['academic_year'],
                'semester' => $this->testData['semester']
            ]));
        }
        
        $entries = TimetableEntry::where([
            'academic_year' => $this->testData['academic_year'],
            'semester' => $this->testData['semester']
        ])->get();
        
        foreach ($entries as $entry) {
            $conflicts = $entry->getAllConflicts();
            $this->assertIsArray($conflicts);
        }
    }

    protected function assertValidSchedule($schedule)
    {
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        
        foreach ($schedule as $entry) {
            // Check required fields
            $this->assertArrayHasKey('course_id', $entry);
            $this->assertArrayHasKey('room_id', $entry);
            $this->assertArrayHasKey('lecturer_id', $entry);
            $this->assertArrayHasKey('day', $entry);
            $this->assertArrayHasKey('time_slot_id', $entry);
            
            // Check for room conflicts
            $roomKey = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            $this->assertArrayNotHasKey($roomKey, $roomTimeSlots, "Room double-booked: {$roomKey}");
            $roomTimeSlots[$roomKey] = true;
            
            // Check for lecturer conflicts
            $lecturerKey = "{$entry['lecturer_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            $this->assertArrayNotHasKey($lecturerKey, $lecturerTimeSlots, "Lecturer double-booked: {$lecturerKey}");
            $lecturerTimeSlots[$lecturerKey] = true;
            
            // Check lecturer availability
            $availability = LecturerAvailability::where([
                'lecturer_id' => $entry['lecturer_id'],
                'day' => $entry['day']
            ])->first();
            
            if ($availability) {
                $timeSlot = TimeSlot::find($entry['time_slot_id']);
                $this->assertTrue(
                    strtotime($timeSlot->start_time) >= strtotime($availability->start_time) &&
                    strtotime($timeSlot->end_time) <= strtotime($availability->end_time),
                    "Lecturer scheduled outside availability"
                );
            }
            
            // Check room capacity
            $room = Room::find($entry['room_id']);
            $course = Course::find($entry['course_id']);
            $enrollmentCount = $course->enrollments()->count();
            $this->assertLessThanOrEqual($room->capacity, $enrollmentCount, "Room capacity exceeded");
        }
    }
} 