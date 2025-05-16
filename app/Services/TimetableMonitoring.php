<?php

namespace App\Services;

use App\Models\TimetableEntry;
use App\Models\TimetableGenerationMetric;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class TimetableMonitoring
{
    const CACHE_KEY_PREFIX = 'timetable_metrics_';
    const CACHE_TTL = 3600; // 1 hour

    public function recordGenerationAttempt(string $jobId, array $metrics)
    {
        try {
            TimetableGenerationMetric::create([
                'job_id' => $jobId,
                'method' => $metrics['method'] ?? 'unknown',
                'duration_seconds' => $metrics['duration'] ?? 0,
                'success' => $metrics['success'] ?? false,
                'entries_generated' => $metrics['entries_generated'] ?? 0,
                'conflicts_count' => $metrics['conflicts_count'] ?? 0,
                'error_message' => $metrics['error_message'] ?? null,
                'academic_year' => $metrics['academic_year'] ?? null,
                'semester' => $metrics['semester'] ?? null,
            ]);

            $this->updatePerformanceMetrics();
        } catch (\Exception $e) {
            Log::error('Failed to record generation metrics', [
                'job_id' => $jobId,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getPerformanceMetrics(): array
    {
        return Cache::remember(self::CACHE_KEY_PREFIX . 'performance', self::CACHE_TTL, function () {
            return $this->calculatePerformanceMetrics();
        });
    }

    protected function calculatePerformanceMetrics(): array
    {
        $metrics = TimetableGenerationMetric::select([
            'method',
            \DB::raw('COUNT(*) as total_attempts'),
            \DB::raw('SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful_attempts'),
            \DB::raw('AVG(duration_seconds) as avg_duration'),
            \DB::raw('AVG(conflicts_count) as avg_conflicts'),
            \DB::raw('AVG(entries_generated) as avg_entries')
        ])
        ->groupBy('method')
        ->get();

        $result = [
            'ai_optimizer' => [
                'success_rate' => 0,
                'avg_duration' => 0,
                'avg_conflicts' => 0,
                'avg_entries' => 0,
                'total_attempts' => 0
            ],
            'genetic_algorithm' => [
                'success_rate' => 0,
                'avg_duration' => 0,
                'avg_conflicts' => 0,
                'avg_entries' => 0,
                'total_attempts' => 0
            ]
        ];

        foreach ($metrics as $metric) {
            if (isset($result[$metric->method])) {
                $result[$metric->method] = [
                    'success_rate' => $metric->total_attempts > 0 
                        ? ($metric->successful_attempts / $metric->total_attempts) * 100 
                        : 0,
                    'avg_duration' => round($metric->avg_duration, 2),
                    'avg_conflicts' => round($metric->avg_conflicts, 2),
                    'avg_entries' => round($metric->avg_entries, 2),
                    'total_attempts' => $metric->total_attempts
                ];
            }
        }

        return $result;
    }

    public function getRecentFailures(int $limit = 10): array
    {
        return TimetableGenerationMetric::where('success', false)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($metric) {
                return [
                    'job_id' => $metric->job_id,
                    'method' => $metric->method,
                    'error_message' => $metric->error_message,
                    'academic_year' => $metric->academic_year,
                    'semester' => $metric->semester,
                    'timestamp' => $metric->created_at->toDateTimeString()
                ];
            })
            ->toArray();
    }

    public function getMethodRecommendation(array $context): string
    {
        $metrics = $this->getPerformanceMetrics();
        
        // Default to AI optimizer if no clear winner
        $recommendedMethod = 'ai_optimizer';
        
        // If AI optimizer has significantly lower success rate, use genetic algorithm
        if (
            $metrics['ai_optimizer']['total_attempts'] > 10 &&
            $metrics['genetic_algorithm']['total_attempts'] > 10 &&
            $metrics['ai_optimizer']['success_rate'] < $metrics['genetic_algorithm']['success_rate'] - 20
        ) {
            $recommendedMethod = 'genetic_algorithm';
        }
        
        // If the context includes a large number of constraints, prefer genetic algorithm
        if (
            isset($context['constraints']) && 
            count($context['constraints']) > 50
        ) {
            $recommendedMethod = 'genetic_algorithm';
        }
        
        // If previous attempts for this academic year/semester failed with AI, use genetic
        $recentFailures = $this->getRecentFailures();
        $relevantFailures = array_filter($recentFailures, function ($failure) use ($context) {
            return $failure['academic_year'] === $context['academic_year'] &&
                   $failure['semester'] === $context['semester'] &&
                   $failure['method'] === 'ai_optimizer';
        });
        
        if (count($relevantFailures) >= 2) {
            $recommendedMethod = 'genetic_algorithm';
        }
        
        Log::info('Method recommendation', [
            'context' => $context,
            'recommendation' => $recommendedMethod,
            'metrics' => $metrics
        ]);
        
        return $recommendedMethod;
    }

    protected function updatePerformanceMetrics(): void
    {
        Cache::forget(self::CACHE_KEY_PREFIX . 'performance');
        $this->getPerformanceMetrics(); // Recalculate and cache
    }
} 