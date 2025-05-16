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
    public function generate(): void
    {
        try {
            $data = $this->prepareData();
            $prompt = $this->buildPrompt($data);
            $response = $this->askOpenAI($prompt);

            if ($this->isValidResponse($response)) {
                $this->storeTimetable($response);
            } else {
                $this->logAndFallback('Invalid AI response. Running fallback.');
                $this->generateUsingGeneticAlgorithm();
            }
        } catch (\Exception $e) {
            $this->logAndFallback($e->getMessage());
            $this->generateUsingGeneticAlgorithm();
        }
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

    protected function generateUsingGeneticAlgorithm(): void
    {
        // 1. Define initial population
        $courses = Course::all();
        $slots = TimeSlot::all();
        $rooms = Room::all();
        $availability = LecturerAvailability::all();

        $population = $this->initializePopulation($courses, $slots, $rooms);
        $best = null;

        for ($i = 0; $i < 100; $i++) {
            $population = $this->evolve($population, $availability);
            $best = $this->getBest($population);
            if ($best['fitness'] == 0) break;
        }

        TimetableEntry::truncate();
        foreach ($best['chromosome'] as $entry) {
            TimetableEntry::create($entry);
        }

        Notification::create([
            'message' => 'Timetable generated using the genetic algorithm.',
        ]);
    }

    // === Genetic Algorithm Helper Methods ===

    protected function initializePopulation($courses, $slots, $rooms, $size = 50): array
    {
        $population = [];

        for ($i = 0; $i < $size; $i++) {
            $chromosome = [];

            foreach ($courses as $course) {
                $chromosome[] = [
                    'course_code' => $course->code,
                    'room_id' => $rooms->random()->id,
                    'timeslot_id' => $slots->random()->id,
                ];
            }

            $population[] = ['chromosome' => $chromosome, 'fitness' => 0];
        }

        return $population;
    }

    protected function evolve(array $population, $availability): array
    {
        foreach ($population as &$individual) {
            $individual['fitness'] = $this->calculateFitness($individual['chromosome'], $availability);
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

    protected function calculateFitness(array $chromosome, $availability): int
    {
        $conflicts = 0;

        foreach ($chromosome as $entry1) {
            $lecturer = Course::where('code', $entry1['course_code'])->first()->lecturer;
            $slot = TimeSlot::find($entry1['timeslot_id']);

            $isAvailable = $availability->contains(function ($avail) use ($lecturer, $slot) {
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
