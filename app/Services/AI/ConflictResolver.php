<?php

namespace App\Services\AI;

use App\Models\TimetableEntry;
use App\Models\TimeSlot;
use App\Models\Room;
use App\Models\LecturerAvailability;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ConflictResolver
{
    public function suggestAlternatives(TimetableEntry $entry, Collection $conflicts): Collection
    {
        // Get all available time slots
        $availableSlots = TimeSlot::all();
        $availableRooms = Room::all();
        
        // Get lecturer availability
        $lecturerAvailability = LecturerAvailability::where('lecturer_id', $entry->lecturer_id)->get();
        
        // Score each possible combination
        $suggestions = collect();
        
        foreach ($availableSlots as $slot) {
            foreach ($availableRooms as $room) {
                $score = $this->calculateScore([
                    'time_slot' => $slot,
                    'room' => $room,
                    'lecturer_availability' => $lecturerAvailability,
                    'original_entry' => $entry,
                    'existing_conflicts' => $conflicts
                ]);
                
                if ($score > 0) {
                    $suggestions->push([
                        'time_slot' => $slot,
                        'room' => $room,
                        'score' => $score,
                        'reason' => $this->generateReason($score, $slot, $room)
                    ]);
                }
            }
        }
        
        // Return top 5 suggestions sorted by score
        return $suggestions->sortByDesc('score')->take(5);
    }
    
    private function calculateScore(array $data): float
    {
        $score = 0;
        $slot = $data['time_slot'];
        $room = $data['room'];
        $availability = $data['lecturer_availability'];
        $entry = $data['original_entry'];
        
        // Check lecturer availability (+30 points)
        if ($availability->contains('time_slot_id', $slot->id)) {
            $score += 30;
        }
        
        // Room capacity suitability (+20 points)
        if ($room->capacity >= $entry->expected_students) {
            $score += 20;
        }
        
        // Time proximity to original slot (+15 points max)
        $proximityScore = $this->calculateTimeProximity($slot, $entry->time_slot);
        $score += $proximityScore;
        
        // Same day bonus (+10 points)
        if ($slot->day === $entry->day) {
            $score += 10;
        }
        
        // Same building/location bonus (+5 points)
        if ($room->building === $entry->room->building) {
            $score += 5;
        }
        
        return $score;
    }
    
    private function calculateTimeProximity($slot1, $slot2): float
    {
        // Calculate how close the suggested time is to original time
        // Returns 0-15 points based on proximity
        $timeDiff = abs(strtotime($slot1->start_time) - strtotime($slot2->start_time));
        $hoursDiff = $timeDiff / 3600;
        
        if ($hoursDiff <= 1) return 15;
        if ($hoursDiff <= 2) return 10;
        if ($hoursDiff <= 3) return 5;
        return 0;
    }
    
    private function generateReason(float $score, TimeSlot $slot, Room $room): string
    {
        $reasons = [];
        
        if ($score >= 60) {
            $reasons[] = "Optimal match with high compatibility";
        }
        if ($score >= 30) {
            $reasons[] = "Lecturer is available";
        }
        if ($score >= 20) {
            $reasons[] = "Room capacity is suitable";
        }
        
        return implode(", ", $reasons);
    }
}
