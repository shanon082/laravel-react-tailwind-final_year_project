<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimetableGenerationMetric extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_id',
        'method',
        'duration_seconds',
        'success',
        'entries_generated',
        'conflicts_count',
        'error_message',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'success' => 'boolean',
        'duration_seconds' => 'float',
        'entries_generated' => 'integer',
        'conflicts_count' => 'integer',
    ];

    /**
     * Get the success rate for a specific method
     */
    public static function getSuccessRate(string $method): float
    {
        $total = self::where('method', $method)->count();
        if ($total === 0) {
            return 0;
        }

        $successful = self::where('method', $method)
            ->where('success', true)
            ->count();

        return ($successful / $total) * 100;
    }

    /**
     * Get average duration for successful generations
     */
    public static function getAverageDuration(string $method): float
    {
        return self::where('method', $method)
            ->where('success', true)
            ->avg('duration_seconds') ?? 0;
    }

    /**
     * Get average number of conflicts for successful generations
     */
    public static function getAverageConflicts(string $method): float
    {
        return self::where('method', $method)
            ->where('success', true)
            ->avg('conflicts_count') ?? 0;
    }

    /**
     * Get the most common error messages for a method
     */
    public static function getCommonErrors(string $method, int $limit = 5): array
    {
        return self::where('method', $method)
            ->where('success', false)
            ->whereNotNull('error_message')
            ->select('error_message', \DB::raw('COUNT(*) as count'))
            ->groupBy('error_message')
            ->orderByDesc('count')
            ->limit($limit)
            ->get()
            ->toArray();
    }
} 