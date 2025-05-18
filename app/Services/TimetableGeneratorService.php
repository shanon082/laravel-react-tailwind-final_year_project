<?php
namespace App\Services;

use App\Models\Course;
use App\Models\LecturerAvailability;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Models\Conflict;
use App\Models\Notification;
use App\Models\Lecturer;
use App\Http\Controllers\TimetableController;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use OpenAI\Laravel\Facades\OpenAI;

class TimetableGeneratorService
{
    protected $maxAttempts = 3;
    protected $maxCoursesPerDay = 3;
    protected $days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    public function generate(string $academicYear, int $semester, $courses, $rooms, $lecturers, $timeSlots): bool
    {
        $monitoring = new TimetableMonitoring();
        $startTime = microtime(true);
        try {
            // First attempt: Try using OpenAI for optimal solution
            $aiSchedule = $this->generateUsingAI($academicYear, $semester, $courses, $rooms, $lecturers, $timeSlots);
            
            if ($aiSchedule && $this->validateSchedule($aiSchedule)) {
                $this->saveSchedule($aiSchedule);
                $monitoring->recordGenerationAttempt(uniqid('timetable_'), [
                    'method' => 'ai_optimizer',
                    'duration' => microtime(true) - $startTime,
                    'success' => true,
                    'entries_generated' => count($aiSchedule),
                    'conflicts_count' => 0,
                    'academic_year' => $academicYear,
                    'semester' => $semester
                ]);
                Log::info('Successfully generated timetable using AI');
                return true;
            }

            // Second attempt: Try genetic algorithm
            Log::info('AI generation failed or produced invalid schedule, falling back to genetic algorithm');
            $geneticSchedule = $this->generateUsingGeneticAlgorithm($courses, $rooms, $lecturers, $timeSlots);
            
            if ($geneticSchedule && $this->validateSchedule($geneticSchedule)) {
                $this->saveSchedule($geneticSchedule);
                $monitoring->recordGenerationAttempt(uniqid('timetable_'), [
                    'method' => 'genetic_algorithm',
                    'duration' => microtime(true) - $startTime,
                    'success' => true,
                    'entries_generated' => count($geneticSchedule),
                    'conflicts_count' => 0,
                    'academic_year' => $academicYear,
                    'semester' => $semester
                ]);
                Log::info('Successfully generated timetable using genetic algorithm');
                return true;
            }

            throw new \Exception('Failed to generate a valid timetable after multiple attempts');

        } catch (\Exception $e) {
            $monitoring->recordGenerationAttempt(uniqid('timetable_'), [
                'method' => $aiSchedule ? 'ai_optimizer' : 'genetic_algorithm',
                'duration' => microtime(true) - $startTime,
                'success' => false,
                'entries_generated' => 0,
                'conflicts_count' => 0,
                'error_message' => $e->getMessage(),
                'academic_year' => $academicYear,
                'semester' => $semester
            ]);
            Log::error('Timetable generation failed', [
                'error' => $e->getMessage(),
                'academic_year' => $academicYear,
                'semester' => $semester
            ]);
            return false;
        }
    }

    protected function generateUsingAI($academicYear, $semester, $courses, $rooms, $lecturers, $timeSlots): ?array
    {
        try {
            $prompt = $this->buildPrompt([
                'courses' => $courses,
                'rooms' => $rooms,
                'slots' => $timeSlots,
                'availability' => $lecturers->pluck('availability')->flatten(),
                'academic_year' => $academicYear,
                'semester' => $semester
            ]);

            $result = OpenAI::chat()->create([
                'model' => 'gpt-3.5-turbo',
                'messages' => [[
                    'role' => 'user',
                    'content' => $prompt,
                ]],
                'temperature' => 0.7,
                'max_tokens' => 4096
            ]);

            $content = $result['choices'][0]['message']['content'];
            $schedule = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error in AI response', [
                    'error' => json_last_error_msg(),
                    'raw_response' => $content
                ]);
                return null;
            }

            if (!$this->isValidAIResponse($schedule)) {
                Log::warning('AI generated an invalid schedule format', ['response' => $content]);
                return null;
            }

            return $this->formatSchedule($schedule, $academicYear, $semester);

        } catch (\Exception $e) {
            Log::error('AI generation failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'response' => method_exists($e, 'getResponse') ? $e->getResponse()->getBody()->getContents() : null
            ]);
            return null;
        }
    }

    protected function generateUsingGeneticAlgorithm($courses, $rooms, $lecturers, $timeSlots): ?array
    {
        $population = $this->initializePopulation($courses, $rooms, $lecturers, $timeSlots);
        $bestFitness = PHP_INT_MAX;
        $bestSchedule = null;
        $generationsWithoutImprovement = 0;
        $maxGenerationsWithoutImprovement = 20;

        for ($generation = 0; $generation < 100; $generation++) {
            $population = $this->evolve($population, $lecturers);
            $currentBest = $this->getBest($population);

            if ($currentBest['fitness'] < $bestFitness) {
                $bestFitness = $currentBest['fitness'];
                $bestSchedule = $currentBest['chromosome'];
                $generationsWithoutImprovement = 0;
            } else {
                $generationsWithoutImprovement++;
            }

            if ($generationsWithoutImprovement >= $maxGenerationsWithoutImprovement || $bestFitness === 0) {
                break;
            }
        }

        return $bestSchedule;
    }

    protected function validateSchedule(array $schedule): bool
    {
        $validator = new TimetableValidator();
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        $lecturerDailyCourses = [];

        foreach ($schedule as $entry) {
            $course = Course::find($entry['course_id']);
            $room = Room::find($entry['room_id']);
            $lecturer = Lecturer::find($entry['lecturer_id']);
            $timeSlot = TimeSlot::find($entry['time_slot_id']);

            if (!$course || !$room || !$lecturer || !$timeSlot) {
                Log::warning('Invalid schedule entry: missing entity', ['entry' => $entry]);
                return false;
            }

            // Validate assignments
            if (!$validator->validateRoomAssignment($course, $room)) {
                Log::warning('Invalid room assignment', ['course' => $course->id, 'room' => $room->id]);
                return false;
            }
            if (!$validator->validateLecturerAssignment($course, $lecturer)) {
                Log::warning('Invalid lecturer assignment', ['course' => $course->id, 'lecturer' => $lecturer->id]);
                return false;
            }
            if (!$validator->validateTimeSlotAssignment($course, $timeSlot, $entry['day'])) {
                Log::warning('Invalid time slot assignment', ['course' => $course->id, 'time_slot' => $timeSlot->id]);
                return false;
            }

            // Check conflicts
            $conflicts = $validator->checkConflicts($course, $room, $lecturer, $timeSlot, $entry['day']);
            if (!empty($conflicts)) {
                Log::warning('Conflicts detected', ['entry' => $entry, 'conflicts' => $conflicts]);
                return false;
            }

            // Check room conflicts
            $roomKey = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($roomTimeSlots[$roomKey])) {
                Log::warning('Room conflict detected', ['entry' => $entry]);
                return false;
            }
            $roomTimeSlots[$roomKey] = true;

            // Check lecturer conflicts
            $lecturerKey = "{$entry['lecturer_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($lecturerTimeSlots[$lecturerKey])) {
                Log::warning('Lecturer conflict detected', ['entry' => $entry]);
                return false;
            }
            $lecturerTimeSlots[$lecturerKey] = true;

            // Check lecturer's daily course limit
            $lecturerDayKey = "{$entry['lecturer_id']}_{$entry['day']}";
            $lecturerDailyCourses[$lecturerDayKey] = ($lecturerDailyCourses[$lecturerDayKey] ?? 0) + 1;
            if ($lecturerDailyCourses[$lecturerDayKey] > $this->maxCoursesPerDay) {
                Log::warning('Lecturer daily course limit exceeded', ['entry' => $entry]);
                return false;
            }
        }

        return true;
    }

    protected function saveSchedule(array $schedule): void
    {
        $controller = new TimetableController();
        DB::beginTransaction();
        try {
            foreach ($schedule as $entry) {
                $timetableEntry = new TimetableEntry($entry);
                $timetableEntry->load(['course', 'room', 'lecturer', 'timeSlot']);
                $conflicts = $controller->checkForConflicts($timetableEntry);
                if (!empty($conflicts)) {
                    Log::warning('Conflict detected before saving', ['entry' => $entry, 'conflicts' => $conflicts]);
                    throw new \Exception('Schedule contains conflicts: ' . json_encode($conflicts));
                }
                TimetableEntry::create($entry);
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save schedule', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    protected function isValidAIResponse($schedule): bool
    {
        if (!is_array($schedule)) {
            return false;
        }

        $requiredFields = ['course_id', 'room_id', 'lecturer_id', 'day', 'time_slot_id'];
        
        foreach ($schedule as $entry) {
            if (!is_array($entry)) {
                return false;
            }
            
            foreach ($requiredFields as $field) {
                if (!isset($entry[$field])) {
                    return false;
                }
            }
        }

        return true;
    }

    protected function formatSchedule(array $schedule, string $academicYear, int $semester): array
    {
        return array_map(function ($entry) use ($academicYear, $semester) {
            return [
                'course_id' => $entry['course_id'],
                'room_id' => $entry['room_id'],
                'lecturer_id' => $entry['lecturer_id'],
                'day' => $entry['day'],
                'time_slot_id' => $entry['time_slot_id'],
                'academic_year' => $academicYear,
                'semester' => $semester,
                'has_conflict' => false
            ];
        }, $schedule);
    }

    protected function buildPrompt(array $data): string
    {
        $prompt = "Generate a conflict-free university timetable in JSON format. Each entry must include course_id, room_id, lecturer_id, day, and time_slot_id.\n\n";
        $prompt .= "Courses:\n";
        foreach ($data['courses'] as $course) {
            $enrollment = $course->enrollments()->count();
            $prompt .= "- ID: {$course->id}, Code: {$course->code}, Name: {$course->name}, Enrollment: {$enrollment}, Department: {$course->department_id}, Requires Lab: " . ($course->requires_lab ? 'Yes' : 'No') . "\n";
        }

        $prompt .= "\nAvailable Rooms:\n";
        foreach ($data['rooms'] as $room) {
            $prompt .= "- ID: {$room->id}, Name: {$room->name}, Capacity: {$room->capacity}, Is Lab: " . ($room->is_lab ? 'Yes' : 'No') . ", Department: {$room->department_id}\n";
        }

        $prompt .= "\nTime Slots:\n";
        foreach ($data['slots'] as $slot) {
            $prompt .= "- ID: {$slot->id}, Day: {$slot->day}, Start: {$slot->start_time}, End: {$slot->end_time}, Type: {$slot->type}\n";
        }

        $prompt .= "\nLecturer Availability:\n";
        foreach ($data['availability'] as $avail) {
            $lecturer = Lecturer::find($avail->lecturer_id);
            $prompt .= "- Lecturer ID: {$avail->lecturer_id}, Name: {$lecturer->name}, Day: {$avail->day}, Start: {$avail->start_time}, End: {$avail->end_time}\n";
        }

        $prompt .= "\nConstraints:\n";
        $prompt .= "- No room can be booked for multiple courses at the same time slot on the same day.\n";
        $prompt .= "- No lecturer can teach multiple courses at the same time slot on the same day.\n";
        $prompt .= "- Room capacity must be sufficient for course enrollment.\n";
        $prompt .= "- Assign courses only to lecturers available at the chosen time slot.\n";
        $prompt .= "- Lab courses must be assigned to lab rooms.\n";
        $prompt .= "- Courses must be assigned to rooms and lecturers from the same department.\n";
        $prompt .= "- Maximum 3 courses per lecturer per day.\n";
        $prompt .= "- Academic Year: {$data['academic_year']}, Semester: {$data['semester']}.\n";

        $prompt .= "\nReturn the timetable as a JSON array of objects, each with course_id, room_id, lecturer_id, day (MONDAY to FRIDAY), and time_slot_id.\n";
        return $prompt;
    }

    protected function initializePopulation($courses, $rooms, $lecturers, $timeSlots, $size = 50): array
    {
        $population = [];

        for ($i = 0; $i < $size; $i++) {
            $chromosome = [];

            foreach ($courses as $course) {
                $chromosome[] = [
                    'course_code' => $course->code,
                    'room_id' => $rooms->random()->id,
                    'timeslot_id' => $timeSlots->random()->id,
                    'lecturer_id' => $course->lecturer->id,
                    'day' => $timeSlots->random()->day,
                    'has_conflict' => false
                ];
            }

            $population[] = ['chromosome' => $chromosome, 'fitness' => 0];
        }

        return $population;
    }

    protected function evolve(array $population, $lecturers): array
    {
        foreach ($population as &$individual) {
            $individual['fitness'] = $this->calculateFitness($individual['chromosome'], $lecturers);
        }

        usort($population, fn($a, $b) => $a['fitness'] <=> $b['fitness']);

        $nextGen = array_slice($population, 0, 10); // Top 10
        while (count($nextGen) < count($population)) {
            $p1 = $population[array_rand($population)];
            $p2 = $population[array_rand($population)];
            $child = $this->crossover($p1['chromosome'], $p2['chromosome']);
            $this->mutate($child);
            $nextGen[] = ['chromosome' => $child, 'fitness' => 0];
        }

        return $nextGen;
    }

    protected function crossover(array $a, array $b): array
    {
        $cut = rand(0, count($a) - 1);
        return array_merge(array_slice($a, 0, $cut), array_slice($b, $cut));
    }

    protected function mutate(array &$chromosome, $rate = 0.1): void
    {
        foreach ($chromosome as &$gene) {
            if (mt_rand() / mt_getrandmax() < $rate) {
                $gene['timeslot_id'] = TimeSlot::inRandomOrder()->first()->id;
            }
        }
    }

    protected function calculateFitness(array $chromosome, $lecturers): int
    {
        $conflicts = 0;

        foreach ($chromosome as $entry1) {
            $lecturer = Course::where('code', $entry1['course_code'])->first()->lecturer;
            $slot = TimeSlot::find($entry1['timeslot_id']);

            $isAvailable = $lecturers->contains(function ($avail) use ($lecturer, $slot) {
                return $avail->lecturer_id == $lecturer->id &&
                       $avail->day == $slot->day &&
                       $slot->start_time >= $avail->start_time &&
                       $slot->end_time <= $avail->end_time;
            });

            if (!$isAvailable) $conflicts++;

            foreach ($chromosome as $entry2) {
                if ($entry1 !== $entry2 &&
                    $entry1['room_id'] === $entry2['room_id'] &&
                    $entry1['timeslot_id'] === $entry2['timeslot_id']) {
                    $conflicts++;
                }
            }
        }

        return $conflicts;
    }

    protected function getBest(array $population): array
    {
        return $population[0]; // sorted by fitness ascending
    }
}