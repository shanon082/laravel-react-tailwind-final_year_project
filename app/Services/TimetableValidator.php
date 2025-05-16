<?php

namespace App\Services;

use App\Models\Course;
use App\Models\Room;
use App\Models\Lecturer;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\DB;

class TimetableValidator
{
    /**
     * Validate room assignment for a course
     */
    public function validateRoomAssignment(Course $course, Room $room): bool
    {
        // Check room capacity
        if ($room->capacity < $course->enrollment) {
            return false;
        }

        // Check room type compatibility
        if ($course->requires_lab && !$room->is_lab) {
            return false;
        }

        // Check room department preference
        if ($room->department_id && $room->department_id !== $course->department_id) {
            return false;
        }

        return true;
    }

    /**
     * Validate lecturer assignment for a course
     */
    public function validateLecturerAssignment(Course $course, Lecturer $lecturer): bool
    {
        // Check lecturer qualification
        if (!$lecturer->qualifications->contains('qualification', $course->required_qualification)) {
            return false;
        }

        // Check lecturer department
        if ($lecturer->department_id !== $course->department_id) {
            return false;
        }

        // Check lecturer availability
        if (!$lecturer->isAvailableForCourse($course)) {
            return false;
        }

        return true;
    }

    /**
     * Validate time slot assignment
     */
    public function validateTimeSlotAssignment(Course $course, TimeSlot $timeSlot, string $day): bool
    {
        // Check if time slot is during lunch break
        if ($timeSlot->isBreak) {
            return false;
        }

        // Check if time slot fits course duration
        if ($timeSlot->duration_minutes < $course->duration_minutes) {
            return false;
        }

        // Check if time slot is preferred for course type
        if ($course->type === 'lab' && $timeSlot->type !== 'lab') {
            return false;
        }

        return true;
    }

    /**
     * Check for conflicts with existing timetable entries
     */
    public function checkConflicts(Course $course, Room $room, Lecturer $lecturer, TimeSlot $timeSlot, string $day): array
    {
        $conflicts = [];

        // Check room conflicts
        $roomConflicts = DB::table('timetable_entries')
            ->where('room_id', $room->id)
            ->where('day', $day)
            ->where('time_slot_id', $timeSlot->id)
            ->exists();

        if ($roomConflicts) {
            $conflicts[] = ['type' => 'ROOM', 'description' => "Room {$room->name} is double-booked"];
        }

        // Check lecturer conflicts
        $lecturerConflicts = DB::table('timetable_entries')
            ->where('lecturer_id', $lecturer->id)
            ->where('day', $day)
            ->where('time_slot_id', $timeSlot->id)
            ->exists();

        if ($lecturerConflicts) {
            $conflicts[] = ['type' => 'LECTURER', 'description' => "Lecturer {$lecturer->name} is double-booked"];
        }

        return $conflicts;
    }
}
