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
        try {
            // First try AI-based generation
            $schedule = $this->generateUsingAI($academicYear, $semester, $courses, $rooms, $lecturers, $timeSlots);

            // If AI generation fails, fall back to genetic algorithm
            if (!$schedule) {
                $schedule = $this->generateUsingGeneticAlgorithm($courses, $rooms, $lecturers, $timeSlots);
            }

            // If both methods fail, return false
            if (!$schedule || !$this->validateSchedule($schedule)) {
                Log::error('Failed to generate valid timetable using both methods');
                return false;
            }

            // Format and save the schedule
            $formattedSchedule = $this->formatSchedule($schedule, $academicYear, $semester);
            $this->saveSchedule($formattedSchedule);

            return true;
        } catch (\Exception $e) {
            Log::error('Error in timetable generation:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    protected function generateUsingAI($academicYear, $semester, $courses, $rooms, $lecturers, $timeSlots): ?array
    {
        $maxRetries = 3;
        $attempt = 0;
        
        while ($attempt < $maxRetries) {
        try {
            $prompt = $this->buildPrompt([
                'courses' => $courses,
                'rooms' => $rooms,
                'slots' => $timeSlots,
                'availability' => $lecturers->pluck('availability')->flatten(),
                'academic_year' => $academicYear,
                'semester' => $semester
            ]);

                Log::info('Sending request to OpenAI', [
                    'attempt' => $attempt + 1,
                    'courses_count' => $courses->count(),
                    'rooms_count' => $rooms->count(),
                    'time_slots_count' => $timeSlots->count()
                ]);

            $result = OpenAI::chat()->create([
                    'model' => 'gpt-3.5-turbo-16k',
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => 'You are a timetabling expert. Generate a valid university timetable that satisfies all constraints. Your response must be a valid JSON array of timetable entries. Each entry must include course_id, room_id, lecturer_id, time_slot_id, and day fields.'
                        ],
                        [
                    'role' => 'user',
                    'content' => $prompt,
                        ]
                    ],
                    'temperature' => 0.2,
                    'max_tokens' => 8000,
                    'response_format' => ['type' => 'json_object']
            ]);

            $content = $result['choices'][0]['message']['content'];
                
                // Log the raw response for debugging
                Log::debug('OpenAI raw response', [
                    'content' => $content,
                    'attempt' => $attempt + 1
                ]);
                
                // Try to extract JSON if the response contains additional text
                if (preg_match('/\{.*\}/s', $content, $matches)) {
                    $content = $matches[0];
                }
                
            $schedule = json_decode($content, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decode error in AI response', [
                    'error' => json_last_error_msg(),
                        'raw_response' => $content,
                        'attempt' => $attempt + 1
                    ]);
                    throw new \Exception('Failed to parse AI response: ' . json_last_error_msg());
                }

                // Extract the timetable entries array from the response
                $entries = $schedule['timetable'] ?? $schedule['entries'] ?? $schedule;
                
                if (!is_array($entries)) {
                    Log::error('Invalid AI response format', [
                        'response' => $schedule,
                        'attempt' => $attempt + 1
                    ]);
                    throw new \Exception('AI response does not contain a valid timetable array');
                }

                if (!$this->isValidAIResponse($entries)) {
                    Log::warning('AI generated an invalid schedule format', [
                        'response' => $entries,
                        'attempt' => $attempt + 1
                    ]);
                    throw new \Exception('AI response does not match required format');
                }

                $formattedSchedule = $this->formatSchedule($entries, $academicYear, $semester);
                
                // Validate the formatted schedule
                if (!$this->validateSchedule($formattedSchedule)) {
                    throw new \Exception('AI generated schedule failed validation');
                }

                Log::info('Successfully generated timetable using AI', [
                    'entries_count' => count($formattedSchedule),
                    'attempt' => $attempt + 1
                ]);

                return $formattedSchedule;

        } catch (\Exception $e) {
                Log::error('AI generation attempt failed', [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                    'attempt' => $attempt + 1
                ]);
                
                if ($attempt === $maxRetries - 1) {
                    throw new \Exception('AI generation failed after ' . $maxRetries . ' attempts: ' . $e->getMessage());
                }
                
                $attempt++;
                // Add exponential backoff
                sleep(pow(2, $attempt));
            }
        }
        
        return null;
    }

    protected function generateUsingGeneticAlgorithm($courses, $rooms, $lecturers, $timeSlots): ?array
    {
        $populationSize = 100; // Increased from 50
        $population = $this->initializePopulation($courses, $rooms, $lecturers, $timeSlots, $populationSize);
        $bestFitness = PHP_INT_MAX;
        $bestSchedule = null;
        $generationsWithoutImprovement = 0;
        $maxGenerationsWithoutImprovement = 30; // Increased from 20
        $mutationRate = 0.2; // Increased from 0.1

        for ($generation = 0; $generation < 200; $generation++) { // Increased from 100
            $population = $this->evolve($population, $lecturers, $mutationRate);
            $currentBest = $this->getBest($population);

            if ($currentBest['fitness'] < $bestFitness) {
                $bestFitness = $currentBest['fitness'];
                $bestSchedule = $currentBest['chromosome'];
                $generationsWithoutImprovement = 0;
                
                // Adaptive mutation rate
                $mutationRate = max(0.1, $mutationRate * 0.95);
            } else {
                $generationsWithoutImprovement++;
                // Increase mutation rate when stuck
                $mutationRate = min(0.4, $mutationRate * 1.05);
            }

            if ($generationsWithoutImprovement >= $maxGenerationsWithoutImprovement || $bestFitness === 0) {
                break;
            }

            // Log progress every 10 generations
            if ($generation % 10 === 0) {
                Log::info("Generation $generation: Best fitness = $bestFitness, Mutation rate = $mutationRate");
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

        try {
        foreach ($schedule as $entry) {
                // Ensure we have all required IDs
                if (!isset($entry['course_id']) || !isset($entry['room_id']) || 
                    !isset($entry['lecturer_id']) || !isset($entry['time_slot_id'])) {
                    Log::error('Missing required IDs in schedule entry', ['entry' => $entry]);
                    return false;
                }

                // Safely extract IDs, handling both objects and scalar values
                $courseId = $this->extractId($entry['course_id']);
                $roomId = $this->extractId($entry['room_id']);
                $lecturerId = $this->extractId($entry['lecturer_id']);
                $timeSlotId = $this->extractId($entry['time_slot_id']);

                if ($courseId === null || $roomId === null || $lecturerId === null || $timeSlotId === null) {
                    Log::error('Invalid ID values in schedule entry', [
                        'course_id' => $entry['course_id'],
                        'room_id' => $entry['room_id'],
                        'lecturer_id' => $entry['lecturer_id'],
                        'time_slot_id' => $entry['time_slot_id']
                    ]);
                    return false;
                }

                // Fetch the models with error handling
                try {
                    $course = Course::findOrFail($courseId);
                    $room = Room::findOrFail($roomId);
                    $lecturer = Lecturer::findOrFail($lecturerId);
                    $timeSlot = TimeSlot::findOrFail($timeSlotId);
                } catch (\Exception $e) {
                    Log::error('Failed to find required models', [
                        'error' => $e->getMessage(),
                        'course_id' => $courseId,
                        'room_id' => $roomId,
                        'lecturer_id' => $lecturerId,
                        'time_slot_id' => $timeSlotId
                    ]);
                return false;
            }

            // Validate assignments
            if (!$validator->validateRoomAssignment($course, $room)) {
                    Log::warning('Invalid room assignment', [
                        'course_id' => $course->id,
                        'room_id' => $room->id,
                        'course_enrollment' => $course->enrollments()->count(),
                        'room_capacity' => $room->capacity
                    ]);
                return false;
            }

                // Check for room and lecturer conflicts
                $key = "{$room->id}_{$entry['day']}_{$timeSlot->id}";
                $lecturerKey = "{$lecturer->id}_{$entry['day']}_{$timeSlot->id}";

                if (isset($roomTimeSlots[$key])) {
                    Log::warning('Room scheduling conflict detected', [
                        'room_id' => $room->id,
                        'day' => $entry['day'],
                        'time_slot' => $timeSlot->id
                    ]);
                return false;
            }

            if (isset($lecturerTimeSlots[$lecturerKey])) {
                    Log::warning('Lecturer scheduling conflict detected', [
                        'lecturer_id' => $lecturer->id,
                        'day' => $entry['day'],
                        'time_slot' => $timeSlot->id
                    ]);
                return false;
            }

                $roomTimeSlots[$key] = true;
            $lecturerTimeSlots[$lecturerKey] = true;

                // Track lecturer's daily course count
                $lecturerDay = "{$lecturer->id}_{$entry['day']}";
                $lecturerDailyCourses[$lecturerDay] = ($lecturerDailyCourses[$lecturerDay] ?? 0) + 1;

                // Check if lecturer has too many courses in one day (max 4)
                if (($lecturerDailyCourses[$lecturerDay] ?? 0) > 4) {
                    Log::warning('Lecturer has too many courses in one day', [
                        'lecturer_id' => $lecturer->id,
                        'day' => $entry['day'],
                        'course_count' => $lecturerDailyCourses[$lecturerDay]
                    ]);
                return false;
            }
        }

        return true;
        } catch (\Exception $e) {
            Log::error('Error in validateSchedule', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return false;
        }
    }

    /**
     * Helper method to safely extract ID from various input types
     * @param mixed $input
     * @return int|null
     */
    protected function extractId($input): ?int
    {
        if (is_object($input)) {
            return $input->id ?? null;
        }
        if (is_array($input) && isset($input['id'])) {
            return (int)$input['id'];
        }
        if (is_numeric($input)) {
            return (int)$input;
        }
        return null;
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
        
        foreach ($schedule as $entry) {
            if (!is_array($entry)) {
                return false;
            }
            
            // Check for required fields
            $requiredFields = ['course_id', 'room_id', 'lecturer_id', 'time_slot_id', 'day'];
            foreach ($requiredFields as $field) {
                if (!isset($entry[$field])) {
                    Log::warning('Missing required field in AI response', [
                        'field' => $field,
                        'entry' => $entry
                    ]);
                    return false;
                }
            }

            // Validate field types
            if (!is_numeric($entry['course_id']) ||
                !is_numeric($entry['room_id']) ||
                !is_numeric($entry['lecturer_id']) ||
                !is_numeric($entry['time_slot_id']) ||
                !is_string($entry['day'])) {
                Log::warning('Invalid field type in AI response', [
                    'entry' => $entry
                ]);
                return false;
            }

            // Validate day value
            if (!in_array($entry['day'], ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'])) {
                Log::warning('Invalid day value in AI response', [
                    'day' => $entry['day']
                ]);
                return false;
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
        $prompt = "Generate a university timetable with the following constraints:\n\n";
        
        // Course information
        $prompt .= "Courses:\n";
        foreach ($data['courses'] as $course) {
            $prompt .= "- {$course->code}: {$course->name} (Credits: {$course->credit_units}, Department: {$course->department->name})\n";
        }

        // Room information
        $prompt .= "\nRooms:\n";
        foreach ($data['rooms'] as $room) {
            $prompt .= "- {$room->name} (Capacity: {$room->capacity}, Type: {$room->type})\n";
        }

        // Time slots
        $prompt .= "\nTime Slots:\n";
        foreach ($data['slots'] as $slot) {
            $prompt .= "- {$slot->start_time} - {$slot->end_time}\n";
        }

        // Lecturer availability
        $prompt .= "\nLecturer Availability:\n";
        foreach ($data['availability'] as $availability) {
            $prompt .= "- Lecturer ID {$availability->lecturer_id}: {$availability->day} {$availability->start_time} - {$availability->end_time}\n";
        }

        // Constraints
        $prompt .= "\nConstraints:\n";
        $prompt .= "1. No lecturer can teach more than one class at the same time\n";
        $prompt .= "2. No room can be used for more than one class at the same time\n";
        $prompt .= "3. Classes must be scheduled within lecturer availability\n";
        $prompt .= "4. Room capacity must be sufficient for the course\n";
        $prompt .= "5. Maximum 3 courses per day for each lecturer\n";
        
        $prompt .= "\nPlease generate a valid timetable in the following JSON format:\n";
        $prompt .= '[{"course_id": number, "room_id": number, "lecturer_id": number, "day": "MONDAY"/"TUESDAY"/etc., "time_slot_id": number}, ...]\n';
        
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

    protected function evolve(array $population, $lecturers, $mutationRate): array
    {
        $newPopulation = [];
        $populationSize = count($population);
        $eliteSize = (int)($populationSize * 0.1); // Keep top 10% of population

        // Sort population by fitness
        usort($population, function($a, $b) {
            return $a['fitness'] <=> $b['fitness'];
        });

        // Keep elite chromosomes
        for ($i = 0; $i < $eliteSize; $i++) {
            $newPopulation[] = $population[$i];
        }

        // Tournament selection and crossover for the rest
        while (count($newPopulation) < $populationSize) {
            $parent1 = $this->tournamentSelect($population, 5);
            $parent2 = $this->tournamentSelect($population, 5);
            
            list($child1, $child2) = $this->crossover($parent1['chromosome'], $parent2['chromosome']);
            
            $this->mutate($child1, $mutationRate);
            $this->mutate($child2, $mutationRate);
            
            $newPopulation[] = [
                'chromosome' => $child1,
                'fitness' => $this->calculateFitness($child1, $lecturers)
            ];
            
            if (count($newPopulation) < $populationSize) {
                $newPopulation[] = [
                    'chromosome' => $child2,
                    'fitness' => $this->calculateFitness($child2, $lecturers)
                ];
            }
        }

        return $newPopulation;
    }

    protected function tournamentSelect(array $population, int $tournamentSize): array
    {
        $tournament = [];
        $populationSize = count($population);
        
        for ($i = 0; $i < $tournamentSize; $i++) {
            $tournament[] = $population[rand(0, $populationSize - 1)];
        }
        
        usort($tournament, function($a, $b) {
            return $a['fitness'] <=> $b['fitness'];
        });
        
        return $tournament[0];
    }

    protected function crossover(array $parent1, array $parent2): array
    {
        $size = count($parent1);
        $crossoverPoint1 = rand(0, $size - 2);
        $crossoverPoint2 = rand($crossoverPoint1 + 1, $size - 1);
        
        $child1 = array_merge(
            array_slice($parent1, 0, $crossoverPoint1),
            array_slice($parent2, $crossoverPoint1, $crossoverPoint2 - $crossoverPoint1),
            array_slice($parent1, $crossoverPoint2)
        );
        
        $child2 = array_merge(
            array_slice($parent2, 0, $crossoverPoint1),
            array_slice($parent1, $crossoverPoint1, $crossoverPoint2 - $crossoverPoint1),
            array_slice($parent2, $crossoverPoint2)
        );
        
        return [$child1, $child2];
    }

    protected function mutate(array &$chromosome, $rate): void
    {
        foreach ($chromosome as &$gene) {
            if (rand(0, 100) / 100 < $rate) {
                $type = rand(0, 2);
                switch ($type) {
                    case 0: // Mutate time slot
                        $gene['time_slot_id'] = TimeSlot::inRandomOrder()->first()->id;
                        break;
                    case 1: // Mutate room
                        $gene['room_id'] = Room::inRandomOrder()->first()->id;
                        break;
                    case 2: // Mutate day
                        $gene['day'] = $this->days[array_rand($this->days)];
                        break;
                }
            }
        }
    }

    protected function calculateFitness(array $chromosome, $lecturers): int
    {
        $validator = new TimetableValidator();
        $conflicts = 0;
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        $lecturerDailyCourses = [];
        $studentGroupTimeSlots = [];

        foreach ($chromosome as $entry) {
            $course = Course::find($entry['course_id']);
            $room = Room::find($entry['room_id']);
            $lecturer = Lecturer::find($entry['lecturer_id']);
            $timeSlot = TimeSlot::find($entry['time_slot_id']);
            $day = $entry['day'];

            // Room conflicts
            $roomKey = "{$room->id}_{$day}_{$timeSlot->id}";
            if (isset($roomTimeSlots[$roomKey])) {
                $conflicts += 10;
            }
            $roomTimeSlots[$roomKey] = true;

            // Lecturer conflicts
            $lecturerKey = "{$lecturer->id}_{$day}_{$timeSlot->id}";
            if (isset($lecturerTimeSlots[$lecturerKey])) {
                $conflicts += 10;
            }
            $lecturerTimeSlots[$lecturerKey] = true;

            // Daily course load for lecturer
            $lecturerDayKey = "{$lecturer->id}_{$day}";
            $lecturerDailyCourses[$lecturerDayKey] = ($lecturerDailyCourses[$lecturerDayKey] ?? 0) + 1;
            if ($lecturerDailyCourses[$lecturerDayKey] > $this->maxCoursesPerDay) {
                $conflicts += 5;
            }

            // Student group conflicts
            $groupKey = "{$course->year_level}_{$course->department_id}_{$day}_{$timeSlot->id}";
            if (isset($studentGroupTimeSlots[$groupKey])) {
                $conflicts += 10;
            }
            $studentGroupTimeSlots[$groupKey] = true;

            // Room capacity
            if ($room->capacity < $course->enrollments()->count()) {
                $conflicts += 3;
            }

            // Lab requirement
            if ($course->requires_lab && !$room->is_lab) {
                $conflicts += 5;
            }

            // Lunch break violation (12:00-13:00)
            $slotStart = strtotime($timeSlot->start_time);
            $slotEnd = strtotime($timeSlot->end_time);
            $lunchStart = strtotime('12:00:00');
            $lunchEnd = strtotime('13:00:00');
            if ($slotStart < $lunchEnd && $slotEnd > $lunchStart) {
                $conflicts += 8;
            }

            // Course duration vs time slot duration
            $courseDuration = $course->credit_units * 60;
            if ($timeSlot->getDurationAttribute() < $courseDuration) {
                $conflicts += 4;
            }
        }

        return $conflicts;
    }

    protected function getBest(array $population): array
    {
        return $population[0]; // sorted by fitness ascending
    }
}