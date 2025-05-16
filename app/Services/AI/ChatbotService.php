<?php

namespace App\Services\AI;

use App\Models\TimetableEntry;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\Room;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use OpenAI\Laravel\Facades\OpenAI;

class ChatbotService
{
    private $user;
    private $context;

    public function __construct()
    {
        $this->user = Auth::user();
        $this->context = [];
    }

    public function processQuery(string $query): array
    {
        try {
            // Analyze query intent
            $intent = $this->analyzeIntent($query);
            
            // Process based on intent
            $response = match ($intent) {
                'schedule_query' => $this->handleScheduleQuery($query),
                'room_query' => $this->handleRoomQuery($query),
                'lecturer_query' => $this->handleLecturerQuery($query),
                'conflict_query' => $this->handleConflictQuery($query),
                'general_query' => $this->handleGeneralQuery($query),
                default => $this->handleGeneralQuery($query),
            };

            return [
                'success' => true,
                'response' => $response,
                'suggestions' => $this->generateSuggestions($intent, $query),
            ];

        } catch (\Exception $e) {
            Log::error('Chatbot error: ' . $e->getMessage());
            return [
                'success' => false,
                'response' => 'I encountered an error processing your request. Please try rephrasing your question.',
                'suggestions' => ['Show my schedule', 'Find available rooms', 'Check conflicts'],
            ];
        }
    }

    private function analyzeIntent(string $query): string
    {
        $query = strtolower($query);
        
        if (str_contains($query, ['schedule', 'class', 'lecture', 'when'])) {
            return 'schedule_query';
        }
        
        if (str_contains($query, ['room', 'where', 'location', 'building'])) {
            return 'room_query';
        }
        
        if (str_contains($query, ['lecturer', 'professor', 'teacher', 'instructor'])) {
            return 'lecturer_query';
        }
        
        if (str_contains($query, ['conflict', 'clash', 'overlap'])) {
            return 'conflict_query';
        }
        
        return 'general_query';
    }

    private function handleScheduleQuery(string $query): string
    {
        // Get user's role-specific schedule
        if ($this->user->hasRole('student')) {
            $schedule = $this->getStudentSchedule();
        } elseif ($this->user->hasRole('lecturer')) {
            $schedule = $this->getLecturerSchedule();
        } else {
            $schedule = $this->getGeneralSchedule();
        }

        return $this->formatScheduleResponse($schedule);
    }

    private function handleRoomQuery(string $query): string
    {
        $rooms = Room::query()
            ->when(str_contains($query, 'available'), function ($q) {
                return $q->whereNotIn('id', function ($sub) {
                    $sub->select('room_id')
                        ->from('timetable_entries')
                        ->where('day', now()->dayOfWeek)
                        ->where('time_slot_id', $this->getCurrentTimeSlot()->id);
                });
            })
            ->get();

        return $this->formatRoomResponse($rooms);
    }

    private function handleLecturerQuery(string $query): string
    {
        $lecturers = Lecturer::query()
            ->when(str_contains($query, 'available'), function ($q) {
                return $q->whereNotIn('id', function ($sub) {
                    $sub->select('lecturer_id')
                        ->from('timetable_entries')
                        ->where('day', now()->dayOfWeek)
                        ->where('time_slot_id', $this->getCurrentTimeSlot()->id);
                });
            })
            ->get();

        return $this->formatLecturerResponse($lecturers);
    }

    private function handleConflictQuery(string $query): string
    {
        $conflicts = TimetableEntry::query()
            ->select('timetable_entries.*')
            ->join('timetable_entries as t2', function ($join) {
                $join->on('timetable_entries.day', '=', 't2.day')
                    ->on('timetable_entries.time_slot_id', '=', 't2.time_slot_id')
                    ->where('timetable_entries.id', '<>', 't2.id');
            })
            ->get();

        return $this->formatConflictResponse($conflicts);
    }

    private function handleGeneralQuery(string $query): string
    {
        // Use OpenAI to generate a contextual response
        $response = OpenAI::chat()->create([
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a helpful timetable assistant. Keep responses brief and focused on scheduling.'],
                ['role' => 'user', 'content' => $query],
            ],
        ]);

        return $response->choices[0]->message->content;
    }

    private function generateSuggestions(string $intent, string $query): array
    {
        return match ($intent) {
            'schedule_query' => ['Show next class', 'View weekly schedule', 'Find free slots'],
            'room_query' => ['Find available rooms', 'Room capacity', 'Room facilities'],
            'lecturer_query' => ['Lecturer availability', 'Office hours', 'Contact info'],
            'conflict_query' => ['Show all conflicts', 'Resolve conflicts', 'Prevent conflicts'],
            default => ['Show my schedule', 'Find available rooms', 'Check conflicts'],
        };
    }

    private function getCurrentTimeSlot()
    {
        return TimeSlot::where('start_time', '<=', now()->format('H:i:s'))
            ->where('end_time', '>', now()->format('H:i:s'))
            ->first();
    }

    private function formatScheduleResponse($schedule): string
    {
        if ($schedule->isEmpty()) {
            return "You have no scheduled classes at this time.";
        }

        $response = "Here's your schedule:\n";
        foreach ($schedule as $entry) {
            $response .= "- {$entry->course->name} at {$entry->timeSlot->start_time} in {$entry->room->name}\n";
        }
        return $response;
    }

    private function formatRoomResponse($rooms): string
    {
        if ($rooms->isEmpty()) {
            return "No rooms match your criteria at this time.";
        }

        $response = "Found these rooms:\n";
        foreach ($rooms as $room) {
            $response .= "- {$room->name} (Capacity: {$room->capacity})\n";
        }
        return $response;
    }

    private function formatLecturerResponse($lecturers): string
    {
        if ($lecturers->isEmpty()) {
            return "No lecturers match your criteria at this time.";
        }

        $response = "Found these lecturers:\n";
        foreach ($lecturers as $lecturer) {
            $response .= "- {$lecturer->name}\n";
        }
        return $response;
    }

    private function formatConflictResponse($conflicts): string
    {
        if ($conflicts->isEmpty()) {
            return "No conflicts found in the schedule.";
        }

        $response = "Found these conflicts:\n";
        foreach ($conflicts as $conflict) {
            $response .= "- Conflict between {$conflict->course->name} and {$conflict->conflicting_course}\n";
        }
        return $response;
    }
}
