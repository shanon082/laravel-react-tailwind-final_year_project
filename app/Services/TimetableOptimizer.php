<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Room;
use App\Models\Lecturer;
use App\Models\TimeSlot;
use App\Models\LecturerAvailability;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class TimetableOptimizer
{
    protected $population = [];
    protected $populationSize = 100;
    protected $generations = 100;
    protected $mutationRate = 0.1;
    protected $elitismCount = 5;
    protected $tournamentSize = 5;
    protected $crossoverRate = 0.8;

    public function generateUsingGeneticAlgorithm(array $data)
    {
        Log::info('Starting genetic algorithm optimization', [
            'population_size' => $this->populationSize,
            'generations' => $this->generations,
            'mutation_rate' => $this->mutationRate
        ]);

        $courses = collect($data['courses']);
        $rooms = collect($data['rooms']);
        $lecturers = collect($data['lecturers']);
        $timeSlots = TimeSlot::all();
        
        $this->initializePopulation($courses, $rooms, $lecturers, $timeSlots);
        
        $bestSchedule = $this->evolve($courses, $rooms, $lecturers, $timeSlots);
        
        return $this->formatSchedule($bestSchedule);
    }

    protected function initializePopulation($courses, $rooms, $lecturers, $timeSlots)
    {
        $this->population = [];
        for ($i = 0; $i < $this->populationSize; $i++) {
            $schedule = $this->generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots);
            if ($this->isValidSchedule($schedule)) {
                $this->population[] = $schedule;
            } else {
                $i--; // Try again if schedule is invalid
            }
        }
    }

    protected function isValidSchedule($schedule)
    {
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        
        foreach ($schedule as $entry) {
            $key = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            $lecturerKey = "{$entry['lecturer_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            
            if (isset($roomTimeSlots[$key]) || isset($lecturerTimeSlots[$lecturerKey])) {
                return false;
            }
            
            $roomTimeSlots[$key] = true;
            $lecturerTimeSlots[$lecturerKey] = true;
        }
        
        return true;
    }

    protected function generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots)
    {
        $schedule = [];
        
        foreach ($courses as $course) {
            $validRooms = $rooms->where('capacity', '>=', $course->enrollments()->count());
            $validLecturers = $lecturers->where('department_id', $course->department_id);
            
            if ($validRooms->isEmpty() || $validLecturers->isEmpty()) {
                Log::warning('No valid room or lecturer for course', ['course_id' => $course->id]);
                return []; // Return empty to trigger retry
            }

            $schedule[] = [
                'course_id' => $course->id,
                'room_id' => $validRooms->random()->id,
                'lecturer_id' => $validLecturers->random()->id,
                'day' => rand(1, 5),
                'time_slot_id' => $timeSlots->random()->id
            ];
        }
        
        return $schedule;
    }

    protected function evolve($courses, $rooms, $lecturers, $timeSlots)
    {
        $bestFitness = -INF;
        $bestSchedule = null;
        $generationsWithoutImprovement = 0;

        for ($generation = 0; $generation < $this->generations; $generation++) {
            $fitnessScores = $this->evaluatePopulation();
            
            $currentBest = max($fitnessScores);
            $currentBestIndex = array_search($currentBest, $fitnessScores);
            
            if ($currentBest > $bestFitness) {
                $bestFitness = $currentBest;
                $bestSchedule = $this->population[$currentBestIndex];
                $generationsWithoutImprovement = 0;
            } else {
                $generationsWithoutImprovement++;
            }
            
            // Early stopping after 20 generations without improvement
            if ($generationsWithoutImprovement > 20) {
                Log::info("Early stopping at generation {$generation} due to no improvement");
                break;
            }
            
            $newPopulation = $this->selection($fitnessScores);
            $elites = array_slice($this->population, 0, $this->elitismCount);
            $offspring = $this->crossover($newPopulation);
            $this->mutate($offspring, $rooms, $lecturers, $timeSlots);
            
            $this->population = array_merge($elites, $offspring);
            
            Log::info("Generation {$generation}: Best fitness = {$bestFitness}");
        }
        
        return $bestSchedule;
    }

    protected function evaluatePopulation()
    {
        $fitnessScores = [];
        
        foreach ($this->population as $schedule) {
            $fitnessScores[] = $this->calculateFitness($schedule);
        }
        
        return $fitnessScores;
    }

    protected function calculateFitness($schedule)
    {
        $score = 0;
        $conflicts = 0;
        $preferenceScore = 0;
        
        // Room and lecturer conflict checks
        $roomSchedule = [];
        $lecturerSchedule = [];
        $lecturerDailyLoad = [];
        
        foreach ($schedule as $entry) {
            // Room conflicts
            $roomKey = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($roomSchedule[$roomKey])) {
                $conflicts += 10; // Heavy penalty for room conflicts
            }
            $roomSchedule[$roomKey] = true;
            
            // Lecturer conflicts
            $lecturerKey = "{$entry['lecturer_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($lecturerSchedule[$lecturerKey])) {
                $conflicts += 10; // Heavy penalty for lecturer conflicts
            }
            $lecturerSchedule[$lecturerKey] = true;
            
            // Daily teaching load
            $lecturerDayKey = "{$entry['lecturer_id']}_{$entry['day']}";
            $lecturerDailyLoad[$lecturerDayKey] = ($lecturerDailyLoad[$lecturerDayKey] ?? 0) + 1;
            if ($lecturerDailyLoad[$lecturerDayKey] > 4) { // Max 4 classes per day
                $conflicts += 5;
            }
            
            // Check lecturer availability
            $availability = LecturerAvailability::where([
                'lecturer_id' => $entry['lecturer_id'],
                'day' => $entry['day']
            ])->first();
            
            if ($availability) {
                $timeSlot = TimeSlot::find($entry['time_slot_id']);
                if ($timeSlot) {
                    if ($this->isTimeSlotWithinAvailability($timeSlot, $availability)) {
                        $preferenceScore += 2;
                    } else {
                        $conflicts += 8;
                    }
                }
            }
            
            // Room capacity check
            $room = Room::find($entry['room_id']);
            $course = Course::find($entry['course_id']);
            if ($room && $course) {
                $enrollmentCount = $course->enrollments()->count();
                if ($enrollmentCount > $room->capacity) {
                    $conflicts += 5;
                } elseif ($enrollmentCount < ($room->capacity * 0.4)) {
                    $conflicts += 2; // Small penalty for underutilized rooms
                }
            }
        }
        
        // Calculate final score
        $score = 1000 - ($conflicts * 10) + ($preferenceScore * 5);
        return max(0, $score); // Ensure non-negative score
    }

    protected function selection($fitnessScores)
    {
        $selected = [];
        $populationSize = count($this->population);
        
        while (count($selected) < ($populationSize - $this->elitismCount)) {
            // Tournament selection
            $tournament = array_rand($fitnessScores, $this->tournamentSize);
            $bestInTournament = null;
            $bestFitness = -INF;
            
            foreach ($tournament as $index) {
                if ($fitnessScores[$index] > $bestFitness) {
                    $bestFitness = $fitnessScores[$index];
                    $bestInTournament = $this->population[$index];
                }
            }
            
            $selected[] = $bestInTournament;
        }
        
        return $selected;
    }

    protected function crossover($selected)
    {
        $children = [];
        
        while (count($children) < $this->populationSize) {
            $parent1 = $selected[array_rand($selected)];
            $parent2 = $selected[array_rand($selected)];
            
            $crossoverPoint = rand(0, count($parent1) - 1);
            
            $child1 = array_merge(
                array_slice($parent1, 0, $crossoverPoint),
                array_slice($parent2, $crossoverPoint)
            );
            
            $child2 = array_merge(
                array_slice($parent2, 0, $crossoverPoint),
                array_slice($parent1, $crossoverPoint)
            );
            
            $children[] = $child1;
            if (count($children) < $this->populationSize) {
                $children[] = $child2;
            }
        }
        
        return $children;
    }

    protected function mutate($offspring, $rooms, $lecturers, $timeSlots)
    {
        foreach ($offspring as &$schedule) {
            foreach ($schedule as &$entry) {
                if (mt_rand() / mt_getrandmax() < $this->mutationRate) {
                    $course = Course::find($entry['course_id']);
                    $mutation = rand(1, 4);
                    switch ($mutation) {
                        case 1:
                            $validRooms = $rooms->where('capacity', '>=', $course->enrollments()->count());
                            $entry['room_id'] = $validRooms->isEmpty() ? $entry['room_id'] : $validRooms->random()->id;
                            break;
                        case 2:
                            $validLecturers = $lecturers->where('department_id', $course->department_id);
                            $entry['lecturer_id'] = $validLecturers->isEmpty() ? $entry['lecturer_id'] : $validLecturers->random()->id;
                            break;
                        case 3:
                            $entry['day'] = rand(1, 5);
                            break;
                        case 4:
                            $entry['time_slot_id'] = $timeSlots->random()->id;
                            break;
                    }
                }
            }
        }
    }

    protected function isTimeSlotWithinAvailability($timeSlot, $availability)
    {
        $slotStart = strtotime($timeSlot->start_time);
        $slotEnd = strtotime($timeSlot->end_time);
        $availStart = strtotime($availability->start_time);
        $availEnd = strtotime($availability->end_time);
        
        return $slotStart >= $availStart && $slotEnd <= $availEnd;
    }

    protected function formatSchedule($schedule)
    {
        return collect($schedule)->map(function ($entry) {
            return [
                'course_id' => $entry['course_id'],
                'room_id' => $entry['room_id'],
                'lecturer_id' => $entry['lecturer_id'],
                'day' => $entry['day'],
                'time_slot_id' => $entry['time_slot_id']
            ];
        })->all();
    }
}
