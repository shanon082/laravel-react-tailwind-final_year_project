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
        // Check room capacity against course enrollments
        $enrollmentCount = $course->enrollments()->count();
        if ($room->capacity < $enrollmentCount) {
            \Log::warning("Room capacity ({$room->capacity}) is insufficient for course {$course->code} with {$enrollmentCount} enrollments");
            return false;
        }

        // Check room type compatibility (lab vs regular)
        if ($course->requires_lab && !$room->is_lab) {
            \Log::warning("Course {$course->code} requires a lab but room {$room->name} is not a lab");
            return false;
        }

        // Check room department preference if set
        if ($room->department_id && $room->department_id !== $course->department_id) {
            \Log::warning("Room {$room->name} is assigned to a different department than course {$course->code}");
            return false;
        }

        // Check room availability status
        if (!$room->is_active) {
            \Log::warning("Room {$room->name} is currently inactive");
            return false;
        }

        return true;
    }

    /**
     * Validate lecturer assignment for a course
     */
    public function validateLecturerAssignment(Course $course, Lecturer $lecturer, string $day, TimeSlot $timeSlot): bool
    {
        // Check lecturer department
        if ($lecturer->department_id !== $course->department_id) {
            \Log::warning("Lecturer {$lecturer->user->name} is from a different department than course {$course->code}");
            return false;
        }

        // Check lecturer is main lecturer or in same department
        if ($lecturer->id !== $course->lecturer && $lecturer->department_id !== $course->department_id) {
            \Log::warning("Lecturer {$lecturer->user->name} is not assigned to course {$course->code} and not in the same department");
            return false;
        }

        // Check lecturer availability for this time slot
        $availability = $lecturer->availability()
            ->where('day', $day)
            ->get();

        $isAvailable = $availability->contains(function ($slot) use ($timeSlot) {
            return strtotime($slot->start_time) <= strtotime($timeSlot->start_time) &&
                   strtotime($slot->end_time) >= strtotime($timeSlot->end_time);
        });

        if (!$isAvailable) {
            \Log::warning("Lecturer {$lecturer->user->name} is not available for time slot {$timeSlot->start_time} - {$timeSlot->end_time} on {$day}");
            return false;
        }

        // Check maximum courses per day
        $coursesOnDay = DB::table('timetable_entries')
            ->where('lecturer_id', $lecturer->id)
            ->where('day', $day)
            ->count();

        if ($coursesOnDay >= 3) { // Maximum 3 courses per day
            \Log::warning("Lecturer {$lecturer->user->name} already has maximum courses for {$day}");
            return false;
        }

        // Check lecturer workload
        $totalCourses = DB::table('timetable_entries')
            ->where('lecturer_id', $lecturer->id)
            ->count();

        if ($totalCourses >= $lecturer->max_courses) {
            \Log::warning("Lecturer {$lecturer->user->name} has reached maximum course load");
            return false;
        }

        // Check lecturer expertise matches course
        if (!$lecturer->expertise()->where('course_id', $course->id)->exists()) {
            \Log::warning("Lecturer {$lecturer->user->name} may not have expertise for course {$course->code}");
        }

        return true;
    }

    /**
     * Validate time slot assignment
     */
    public function validateTimeSlotAssignment(Course $course, TimeSlot $timeSlot, string $day): bool
    {
        // Check if time slot is during lunch break (assuming 12:00-13:00 is lunch)
        $slotStart = strtotime($timeSlot->start_time);
        $slotEnd = strtotime($timeSlot->end_time);
        $lunchStart = strtotime('12:00:00');
        $lunchEnd = strtotime('13:00:00');

        if (($slotStart < $lunchEnd && $slotEnd > $lunchStart)) {
            \Log::warning("Time slot {$timeSlot->start_time} - {$timeSlot->end_time} overlaps with lunch break");
            return false;
        }

        // Check if time slot duration is sufficient for course
        $courseDuration = $course->credit_units * 60; // Assuming 1 credit unit = 1 hour
        if ($timeSlot->getDurationAttribute() < $courseDuration) {
            \Log::warning("Time slot duration is insufficient for course {$course->code} ({$course->credit_units} credit units)");
            return false;
        }

        // Check if the time slot is within working hours (8:00 AM - 5:00 PM)
        $workStart = strtotime('08:00:00');
        $workEnd = strtotime('17:00:00');
        
        if ($slotStart < $workStart || $slotEnd > $workEnd) {
            \Log::warning("Time slot {$timeSlot->start_time} - {$timeSlot->end_time} is outside working hours");
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

        // Check room conflicts with overlapping time slots
        $roomConflicts = DB::table('timetable_entries AS te')
            ->join('time_slots AS ts', 'te.time_slot_id', '=', 'ts.id')
            ->join('courses AS c', 'te.course_id', '=', 'c.id')
            ->where('te.room_id', $room->id)
            ->where('te.day', $day)
            ->where(function ($query) use ($timeSlot) {
                $query->whereRaw('TIME(ts.start_time) < TIME(?) AND TIME(ts.end_time) > TIME(?)', 
                    [$timeSlot->end_time, $timeSlot->start_time]);
            })
            ->select('c.name as course_name', 'ts.start_time', 'ts.end_time')
            ->get();

        if ($roomConflicts->isNotEmpty()) {
            foreach ($roomConflicts as $conflict) {
                $conflicts[] = [
                    'type' => 'ROOM',
                    'description' => "Room {$room->name} is already booked for {$conflict->course_name} from {$conflict->start_time} to {$conflict->end_time}"
                ];
            }
        }

        // Check lecturer conflicts with overlapping time slots
        $lecturerConflicts = DB::table('timetable_entries AS te')
            ->join('time_slots AS ts', 'te.time_slot_id', '=', 'ts.id')
            ->join('courses AS c', 'te.course_id', '=', 'c.id')
            ->where('te.lecturer_id', $lecturer->id)
            ->where('te.day', $day)
            ->where(function ($query) use ($timeSlot) {
                $query->whereRaw('TIME(ts.start_time) < TIME(?) AND TIME(ts.end_time) > TIME(?)', 
                    [$timeSlot->end_time, $timeSlot->start_time]);
            })
            ->select('c.name as course_name', 'ts.start_time', 'ts.end_time')
            ->get();

        if ($lecturerConflicts->isNotEmpty()) {
            foreach ($lecturerConflicts as $conflict) {
                $conflicts[] = [
                    'type' => 'LECTURER',
                    'description' => "Lecturer {$lecturer->user->name} is already teaching {$conflict->course_name} from {$conflict->start_time} to {$conflict->end_time}"
                ];
            }
        }

        // Check student group conflicts (students can't be in two places at once)
        $studentConflicts = DB::table('timetable_entries AS te1')
            ->join('time_slots AS ts1', 'te1.time_slot_id', '=', 'ts1.id')
            ->join('courses AS c1', 'te1.course_id', '=', 'c1.id')
            ->where('c1.year_level', $course->year_level)
            ->where('c1.department_id', $course->department_id)
            ->where('te1.day', $day)
            ->where(function ($query) use ($timeSlot) {
                $query->whereRaw('TIME(ts1.start_time) < TIME(?) AND TIME(ts1.end_time) > TIME(?)', 
                    [$timeSlot->end_time, $timeSlot->start_time]);
            })
            ->select('c1.name as course_name', 'ts1.start_time', 'ts1.end_time')
            ->get();

        if ($studentConflicts->isNotEmpty()) {
            foreach ($studentConflicts as $conflict) {
                $conflicts[] = [
                    'type' => 'STUDENT_GROUP',
                    'description' => "Students in year {$course->year_level} already have {$conflict->course_name} from {$conflict->start_time} to {$conflict->end_time}"
                ];
            }
        }

        // Check prerequisite course scheduling
        $prerequisites = $course->prerequisites;
        if ($prerequisites->isNotEmpty()) {
            foreach ($prerequisites as $prerequisite) {
                $prerequisiteScheduled = DB::table('timetable_entries AS te')
                    ->join('courses AS c', 'te.course_id', '=', 'c.id')
                    ->where('c.id', $prerequisite->id)
                    ->exists();

                if (!$prerequisiteScheduled) {
                    $conflicts[] = [
                        'type' => 'PREREQUISITE',
                        'description' => "Prerequisite course {$prerequisite->name} must be scheduled before {$course->name}"
                    ];
                }
            }
        }

        return $conflicts;
    }
}
