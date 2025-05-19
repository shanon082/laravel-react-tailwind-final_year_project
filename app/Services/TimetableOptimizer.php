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
    protected $populationSize = 200;
    protected $generations = 200;
    protected $mutationRate = 0.2;
    protected $elitismCount = 10;
    protected $tournamentSize = 5;
    protected $crossoverRate = 0.8;
    protected $maxCoursesPerDay = 3;

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
        $timeSlots = collect($data['timeSlots']);
        
        $this->initializePopulation($courses, $rooms, $lecturers, $timeSlots);
        
        $bestSchedule = $this->evolve($courses, $rooms, $lecturers, $timeSlots);
        
        return $this->formatSchedule($bestSchedule);
    }

    protected function initializePopulation($courses, $rooms, $lecturers, $timeSlots)
    {
        $this->population = [];
        $attempts = 0;
        $maxAttempts = $this->populationSize * 3;

        while (count($this->population) < $this->populationSize && $attempts < $maxAttempts) {
            $schedule = $this->generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots);
            if ($this->isValidSchedule($schedule)) {
                $this->population[] = $schedule;
            }
            $attempts++;
        }

        // If we couldn't generate enough valid schedules, relax constraints
        if (count($this->population) < $this->populationSize) {
            Log::warning('Could not generate enough valid schedules, relaxing constraints', [
                'valid_schedules' => count($this->population),
                'attempts' => $attempts
            ]);
            while (count($this->population) < $this->populationSize) {
                $schedule = $this->generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots, true);
                $this->population[] = $schedule;
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

    protected function generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots, $relaxConstraints = false)
    {
        $schedule = [];
        $roomTimeSlots = [];
        $lecturerTimeSlots = [];
        $lecturerDailyLoad = [];
        
        foreach ($courses as $course) {
            $attempts = 0;
            $maxAttempts = 50;
            $assigned = false;
            
            while (!$assigned && $attempts < $maxAttempts) {
                // Filter valid rooms and lecturers
                $validRooms = $relaxConstraints ? 
                    $rooms : 
                    $rooms->where('capacity', '>=', $course->enrollments()->count())
                          ->where('department_id', $course->department_id);
                
                $validLecturers = $lecturers->filter(function($lecturer) use ($course) {
                    // Main lecturer or same department
                    return $lecturer->id === $course->lecturer || $lecturer->department_id === $course->department_id;
                });
                
                if ($validRooms->isEmpty() || $validLecturers->isEmpty()) {
                    $attempts++;
                    continue;
                }

                $room = $validRooms->random();
                $lecturer = $validLecturers->random();
                $day = array_rand(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']);
                $timeSlot = $timeSlots->random();
                
                $key = "{$room->id}_{$day}_{$timeSlot->id}";
                $lecturerKey = "{$lecturer->id}_{$day}_{$timeSlot->id}";
                $dayKey = "{$lecturer->id}_{$day}";
                
                if ($relaxConstraints || 
                    (!isset($roomTimeSlots[$key]) && 
                     !isset($lecturerTimeSlots[$lecturerKey]) && 
                     ($lecturerDailyLoad[$dayKey] ?? 0) < $this->maxCoursesPerDay)) {
                    
                    $schedule[] = [
                        'course_id' => $course->id,
                        'room_id' => $room->id,
                        'lecturer_id' => $lecturer->id,
                        'day' => $day,
                        'time_slot_id' => $timeSlot->id
                    ];
                    
                    $roomTimeSlots[$key] = true;
                    $lecturerTimeSlots[$lecturerKey] = true;
                    $lecturerDailyLoad[$dayKey] = ($lecturerDailyLoad[$dayKey] ?? 0) + 1;
                    $assigned = true;
                }
                
                $attempts++;
            }
            
            if (!$assigned && !$relaxConstraints) {
                return $this->generateRandomSchedule($courses, $rooms, $lecturers, $timeSlots, true);
            }
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
        $score = 1000; // Start with a high score and subtract penalties
        $conflicts = 0;
        $preferenceScore = 0;
        
        $roomSchedule = [];
        $lecturerSchedule = [];
        $lecturerDailyLoad = [];
        
        foreach ($schedule as $entry) {
            // Room conflicts
            $roomKey = "{$entry['room_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($roomSchedule[$roomKey])) {
                $conflicts += 50; // Increased penalty
            }
            $roomSchedule[$roomKey] = true;
            
            // Lecturer conflicts
            $lecturerKey = "{$entry['lecturer_id']}_{$entry['day']}_{$entry['time_slot_id']}";
            if (isset($lecturerSchedule[$lecturerKey])) {
                $conflicts += 50; // Increased penalty
            }
            $lecturerSchedule[$lecturerKey] = true;
            
            // Daily teaching load
            $lecturerDayKey = "{$entry['lecturer_id']}_{$entry['day']}";
            $lecturerDailyLoad[$lecturerDayKey] = ($lecturerDailyLoad[$lecturerDayKey] ?? 0) + 1;
            if ($lecturerDailyLoad[$lecturerDayKey] > $this->maxCoursesPerDay) {
                $conflicts += 30; // Increased penalty
            }
            
            try {
                // Room capacity and department constraints
                $course = Course::find($entry['course_id']);
                $room = Room::find($entry['room_id']);
                $lecturer = Lecturer::find($entry['lecturer_id']);
                
                if ($course && $room && $lecturer) {
                    if ($room->capacity < $course->enrollments()->count()) {
                        $conflicts += 20;
                    }
                    if ($room->department_id != $course->department_id) {
                        $conflicts += 10;
                    }
                    if ($lecturer->department_id != $course->department_id) {
                        $conflicts += 10;
                    }
                }
                
                // Check lecturer availability
                $availability = LecturerAvailability::where([
                    'lecturer_id' => $entry['lecturer_id'],
                    'day' => $entry['day']
                ])->first();
                
                if ($availability) {
                    $timeSlot = TimeSlot::find($entry['time_slot_id']);
                    if ($timeSlot && $this->isTimeSlotWithinAvailability($timeSlot, $availability)) {
                        $preferenceScore += 5;
                    } else {
                        $conflicts += 40;
                    }
                }
            } catch (\Exception $e) {
                Log::error('Error calculating fitness', [
                    'error' => $e->getMessage(),
                    'entry' => $entry
                ]);
                $conflicts += 100; // Heavy penalty for invalid data
            }
        }
        
        return max(0, $score - $conflicts + $preferenceScore);
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


