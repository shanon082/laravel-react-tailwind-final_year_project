<?php
namespace App\Services;

use App\Models\Course;
use App\Models\LecturerAvailability;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Models\Conflict;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class TimetableGeneratorService
{
    protected $maxAttempts = 3;
    protected $maxCoursesPerDay = 3;
    protected $days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

    public function generate(string $academicYear, int $semester, $courses, $rooms, $lecturers, $timeSlots): bool
    {
        try {
            // First attempt: Try using OpenAI for optimal solution
            $aiSchedule = $this->generateUsingAI($academicYear, $semester, $courses, $rooms, $lecturers, $timeSlots);
            
            if ($aiSchedule && $this->validateSchedule($aiSchedule)) {
                $this->saveSchedule($aiSchedule);
                Log::info('Successfully generated timetable using AI');
                return true;
            }

            // Second attempt: Try genetic algorithm
            Log::info('AI generation failed or produced invalid schedule, falling back to genetic algorithm');
            $geneticSchedule = $this->generateUsingGeneticAlgorithm($courses, $rooms, $lecturers, $timeSlots);
            
            if ($geneticSchedule && $this->validateSchedule($geneticSchedule)) {
                $this->saveSchedule($geneticSchedule);
                Log::info('Successfully generated timetable using genetic algorithm');
                return true;
            }

            // If both methods fail, throw an exception
            throw new \Exception('Failed to generate a valid timetable after multiple attempts');

        } catch (\Exception $e) {
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
                'max_tokens' => 2000
            ]);

            $schedule = json_decode($result['choices'][0]['message']['content'], true);
            
            if (!$this->isValidAIResponse($schedule)) {
                Log::warning('AI generated an invalid schedule format');
                return null;
            }

            return $this->formatSchedule($schedule, $academicYear, $semester);

        } catch (\Exception $e) {
            Log::error('AI generation failed', ['error' => $e->getMessage()]);
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

            // Early stopping if no improvement
            if ($generationsWithoutImprovement >= $maxGenerationsWithoutImprovement || $bestFitness === 0) {
                break;
            }
        }

        return $bestSchedule;
    }

    protected function validateSchedule(array $schedule): bool
    {
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        $lecturerDailyCourses = [];

        foreach ($schedule as $entry) {
            // Check for room conflicts
            $roomKey = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($roomTimeSlots[$roomKey])) {
                Log::warning('Room conflict detected', ['entry' => $entry]);
                return false;
            }
            $roomTimeSlots[$roomKey] = true;

            // Check for lecturer conflicts
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
        foreach ($schedule as $entry) {
            TimetableEntry::create($entry);
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

    protected function prepareData(): array
    {
        return [
            'courses' => Course::with('lecturer')->get(),
            'rooms' => Room::all(),
            'slots' => TimeSlot::all(),
            'availability' => LecturerAvailability::all()
        ];
    }

    protected function buildPrompt(array $data): string
    {
        $prompt = "Generate a conflict-free university timetable. \n";
        $prompt .= "Courses: \n";

        foreach ($data['courses'] as $course) {
            $prompt .= "- {$course->code} ({$course->name}) by {$course->lecturer->name}\n";
        }

        $prompt .= "Available Rooms:\n";
        foreach ($data['rooms'] as $room) {
            $prompt .= "- {$room->name} ({$room->capacity})\n";
        }

        $prompt .= "Time Slots:\n";
        foreach ($data['slots'] as $slot) {
            $prompt .= "- {$slot->day} {$slot->start_time} - {$slot->end_time}\n";
        }

        $prompt .= "Lecturer Availability:\n";
        foreach ($data['availability'] as $avail) {
            $prompt .= "- {$avail->lecturer->name} is available on {$avail->day} from {$avail->start_time} to {$avail->end_time}\n";
        }

        $prompt .= "\nReturn the timetable as JSON with course_code, room_id, timeslot_id.\n";
        return $prompt;
    }

    protected function askOpenAI(string $prompt): array
    {
        $result = OpenAI::chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [[
                'role' => 'user',
                'content' => $prompt,
            ]],
        ]);

        $json = json_decode($result['choices'][0]['message']['content'], true);
        return $json ?? [];
    }

    protected function isValidResponse(array $data): bool
    {
        return is_array($data) && count($data) > 0 && isset($data[0]['course_code']);
    }

    protected function storeTimetable(array $entries): void
    {
        TimetableEntry::truncate(); // Optional: clear old entries

        foreach ($entries as $entry) {
            TimetableEntry::create([
                'course_code' => $entry['course_code'],
                'room_id' => $entry['room_id'],
                'timeslot_id' => $entry['timeslot_id'],
            ]);
        }

        Notification::create([
            'message' => 'New timetable generated successfully via OpenAI.',
        ]);
    }

    // === Genetic Algorithm Helper Methods ===

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

    protected function logAndFallback(string $message): void
    {
        Log::error("[TimetableGeneration] " . $message);
    }
}
