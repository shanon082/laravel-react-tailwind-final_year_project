<?php

namespace App\Jobs;

use App\Models\TimetableEntry;
use App\Services\TimetableOptimizer;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Events\AIOptimizerFailedEvent;

class GenerateTimetableJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $data;
    protected $jobId;

    public function __construct(array $data)
    {
        $this->data = $data;
        $this->jobId = uniqid('timetable_', true);
    }

    public function handle()
    {
        try {
            // Validate required data
            if (!isset($this->data['academic_year'], $this->data['semester'])) {
                throw new \Exception('Missing required academic year or semester');
            }

            // Ensure arrays are initialized
            $this->data['courses'] = $this->data['courses'] ?? [];
            $this->data['rooms'] = $this->data['rooms'] ?? [];
            $this->data['lecturers'] = $this->data['lecturers'] ?? [];
            $this->data['constraints'] = $this->data['constraints'] ?? [];

            // Try AI Optimization API first
            $optimizedSchedule = $this->callAIOptimizer();
            
            if (!$optimizedSchedule) {
                // Fallback to genetic algorithm
                $optimizer = new TimetableOptimizer();
                $optimizedSchedule = $optimizer->generateUsingGeneticAlgorithm($this->data);
            }

            if (empty($optimizedSchedule)) {
                throw new \Exception('Failed to generate schedule');
            }

            // Save the optimized schedule
            $this->saveTimetable($optimizedSchedule);
            
            Log::info('Timetable generation completed', [
                'job_id' => $this->jobId,
                'academic_year' => $this->data['academic_year'],
                'semester' => $this->data['semester']
            ]);
            
        } catch (\Exception $e) {
            Log::error('Timetable generation failed', [
                'job_id' => $this->jobId,
                'error' => $e->getMessage(),
                'data' => $this->data
            ]);
            $this->fail($e);
        }
    }

    protected function callAIOptimizer()
    {
        try {
            Log::info('Attempting AI Optimizer call', [
                'job_id' => $this->jobId,
                'data_size' => [
                    'courses' => count($this->data['courses']),
                    'rooms' => count($this->data['rooms']),
                    'lecturers' => count($this->data['lecturers']),
                    'constraints' => count($this->data['constraints'])
                ]
            ]);

            $startTime = microtime(true);
            $response = Http::timeout(30)->post(config('services.ai_optimizer.url'), [
                'courses' => $this->data['courses'],
                'rooms' => $this->data['rooms'],
                'lecturers' => $this->data['lecturers'],
                'constraints' => $this->data['constraints']
            ]);
            $duration = microtime(true) - $startTime;

            Log::info('AI Optimizer response received', [
                'job_id' => $this->jobId,
                'duration' => round($duration, 2) . 's',
                'status' => $response->status(),
                'success' => $response->successful()
            ]);

            if ($response->successful()) {
                $result = $response->json();
                if (empty($result)) {
                    throw new \Exception('AI Optimizer returned empty result');
                }
                return $result;
            }

            Log::error('AI Optimizer failed', [
                'job_id' => $this->jobId,
                'status' => $response->status(),
                'body' => $response->body()
            ]);
        } catch (\Exception $e) {
            Log::warning('AI Optimizer failed, falling back to genetic algorithm', [
                'job_id' => $this->jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            event(new AIOptimizerFailedEvent($this->jobId, $e->getMessage()));
        }

        return null;
    }

    protected function saveTimetable($schedule)
    {
        try {
            Log::info('Starting timetable save operation', [
                'job_id' => $this->jobId,
                'entries_count' => count($schedule)
            ]);

            DB::beginTransaction();

            // First, clear existing entries for this academic year and semester
            $deletedCount = TimetableEntry::where([
                'academic_year' => $this->data['academic_year'],
                'semester' => $this->data['semester']
            ])->delete();

            Log::info('Deleted existing timetable entries', [
                'job_id' => $this->jobId,
                'deleted_count' => $deletedCount
            ]);

            $savedEntries = 0;
            $errors = [];

            // Then save new entries
            foreach ($schedule as $entry) {
                try {
                    if (!isset($entry['course_id'], $entry['room_id'], $entry['lecturer_id'], $entry['day'], $entry['time_slot_id'])) {
                        throw new \Exception('Invalid schedule entry format: ' . json_encode($entry));
                    }

                    TimetableEntry::create([
                        'course_id' => $entry['course_id'],
                        'room_id' => $entry['room_id'],
                        'lecturer_id' => $entry['lecturer_id'],
                        'day' => $entry['day'],
                        'time_slot_id' => $entry['time_slot_id'],
                        'academic_year' => $this->data['academic_year'],
                        'semester' => $this->data['semester']
                    ]);

                    $savedEntries++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'entry' => $entry,
                        'error' => $e->getMessage()
                    ];
                }
            }

            if (!empty($errors)) {
                Log::warning('Some entries failed to save', [
                    'job_id' => $this->jobId,
                    'saved_entries' => $savedEntries,
                    'failed_entries' => count($errors),
                    'errors' => $errors
                ]);
            }

            if ($savedEntries === 0) {
                throw new \Exception('No entries were saved successfully');
            }

            DB::commit();

            Log::info('Timetable save completed successfully', [
                'job_id' => $this->jobId,
                'total_entries' => count($schedule),
                'saved_entries' => $savedEntries
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save timetable entries', [
                'job_id' => $this->jobId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function getJobId()
    {
        return $this->jobId;
    }
}
