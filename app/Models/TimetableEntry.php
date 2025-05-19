<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimetableEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',
        'room_id',
        'lecturer_id',
        'day',
        'time_slot_id',
        'has_conflict',
        'conflict_type',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'has_conflict' => 'boolean',
        'semester' => 'integer',
    ];

    /**
     * Get the course for this timetable entry.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the room for this timetable entry.
     */
    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    /**
     * Get the lecturer for this timetable entry.
     */
    public function lecturer()
    {
        return $this->belongsTo(Lecturer::class);
    }

    /**
     * Get the time slot for this timetable entry.
     */
    public function timeSlot()
    {
        return $this->belongsTo(TimeSlot::class);
    }

    /**
     * Get the conflicts where this entry is the first entry.
     */
    public function conflictsAsEntry1()
    {
        return $this->hasMany(Conflict::class, 'entry1_id');
    }

    /**
     * Get the conflicts where this entry is the second entry.
     */
    public function conflictsAsEntry2()
    {
        return $this->hasMany(Conflict::class, 'entry2_id');
    }

    /**
     * Get all conflicts related to this entry (from either side).
     */
    public function getAllConflicts()
    {
        return Conflict::where('entry1_id', $this->id)
            ->orWhere('entry2_id', $this->id)
            ->get();
    }

    /**
     * Check if this entry conflicts with another entry.
     *
     * @param \App\Models\TimetableEntry $otherEntry
     * @return array|false Returns false if no conflict, or an array with conflict type and description
     */
    public function conflictsWith(TimetableEntry $otherEntry)
    {
        // No conflict if different days
        if ($this->day !== $otherEntry->day) {
            return false;
        }

        // Load the time slots if they're not loaded yet
        if (!$this->relationLoaded('timeSlot')) {
            $this->load('timeSlot');
        }
        if (!$otherEntry->relationLoaded('timeSlot')) {
            $otherEntry->load('timeSlot');
        }

        // Check for time slot overlap
        if (!$this->timeSlot->overlaps($otherEntry->timeSlot)) {
            return false;
        }

        // Room conflict
        if ($this->room_id === $otherEntry->room_id) {
            return [
                'type' => 'ROOM',
                'description' => "Room {$this->room->name} is double-booked."
            ];
        }

        // Lecturer conflict
        if ($this->lecturer_id === $otherEntry->lecturer_id) {
            return [
                'type' => 'LECTURER',
                'description' => "Lecturer {$this->lecturer->user->full_name} is scheduled for two classes at the same time."
            ];
        }

        return false;
    }
}