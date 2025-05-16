<?php

namespace App\Services\AI;

use App\Models\TimetableEntry;
use App\Models\Course;
use App\Models\Room;
use App\Models\Lecturer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class PredictiveAnalytics
{
    public function analyzeHistoricalPatterns(): array
    {
        return [
            'room_utilization' => $this->analyzeRoomUtilization(),
            'peak_hours' => $this->analyzePeakHours(),
            'course_patterns' => $this->analyzeCoursePatterns(),
            'lecturer_preferences' => $this->analyzeLecturerPreferences(),
        ];
    }

    private function analyzeRoomUtilization(): array
    {
        // Analyze room usage patterns
        $roomUtilization = DB::table('timetable_entries')
            ->select('room_id', DB::raw('COUNT(*) as usage_count'))
            ->groupBy('room_id')
            ->orderByDesc('usage_count')
            ->get();

        // Calculate efficiency scores
        $rooms = Room::all();
        $scores = [];

        foreach ($rooms as $room) {
            $usage = $roomUtilization->firstWhere('room_id', $room->id);
            $utilizationRate = $usage ? $usage->usage_count / 40 : 0; // 40 slots per week
            
            $scores[] = [
                'room' => $room->name,
                'utilization_rate' => $utilizationRate,
                'suggestion' => $this->getRoomSuggestion($utilizationRate),
            ];
        }

        return $scores;
    }

    private function analyzePeakHours(): array
    {
        // Analyze busiest time slots
        $peakHours = DB::table('timetable_entries')
            ->select('time_slot_id', DB::raw('COUNT(*) as slot_count'))
            ->groupBy('time_slot_id')
            ->orderByDesc('slot_count')
            ->get();

        return [
            'peak_slots' => $peakHours,
            'recommendations' => $this->generatePeakHourRecommendations($peakHours),
        ];
    }

    private function analyzeCoursePatterns(): array
    {
        // Analyze course scheduling patterns
        $patterns = DB::table('timetable_entries')
            ->join('courses', 'timetable_entries.course_id', '=', 'courses.id')
            ->select(
                'courses.name',
                'timetable_entries.day',
                'timetable_entries.time_slot_id',
                DB::raw('COUNT(*) as frequency')
            )
            ->groupBy('courses.name', 'timetable_entries.day', 'timetable_entries.time_slot_id')
            ->having('frequency', '>', 1)
            ->get();

        return [
            'patterns' => $patterns,
            'suggestions' => $this->generateCourseRecommendations($patterns),
        ];
    }

    private function analyzeLecturerPreferences(): array
    {
        // Analyze lecturer preferences based on historical data
        $preferences = DB::table('timetable_entries')
            ->join('lecturers', 'timetable_entries.lecturer_id', '=', 'lecturers.id')
            ->select(
                'lecturers.name',
                'timetable_entries.day',
                'timetable_entries.time_slot_id',
                DB::raw('COUNT(*) as preference_count')
            )
            ->groupBy('lecturers.name', 'timetable_entries.day', 'timetable_entries.time_slot_id')
            ->orderByDesc('preference_count')
            ->get();

        return [
            'preferences' => $preferences,
            'optimization_suggestions' => $this->generateLecturerOptimizations($preferences),
        ];
    }

    private function getRoomSuggestion(float $rate): string
    {
        if ($rate < 0.3) {
            return "Room is underutilized. Consider using for additional activities.";
        } elseif ($rate > 0.8) {
            return "Room is heavily utilized. Consider distributing load.";
        }
        return "Room has optimal utilization.";
    }

    private function generatePeakHourRecommendations($peakHours): array
    {
        $recommendations = [];
        foreach ($peakHours as $peak) {
            if ($peak->slot_count > 5) { // If more than 5 classes in same slot
                $recommendations[] = "Consider redistributing some classes from time slot {$peak->time_slot_id}";
            }
        }
        return $recommendations;
    }

    private function generateCourseRecommendations($patterns): array
    {
        $recommendations = [];
        foreach ($patterns as $pattern) {
            if ($pattern->frequency > 2) {
                $recommendations[] = "Course {$pattern->name} shows strong preference for day {$pattern->day}, slot {$pattern->time_slot_id}";
            }
        }
        return $recommendations;
    }

    private function generateLecturerOptimizations($preferences): array
    {
        $optimizations = [];
        foreach ($preferences as $pref) {
            if ($pref->preference_count > 3) {
                $optimizations[] = "Lecturer {$pref->name} shows strong preference for day {$pref->day}, slot {$pref->time_slot_id}";
            }
        }
        return $optimizations;
    }
}
