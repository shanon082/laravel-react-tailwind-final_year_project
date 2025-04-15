<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Conflict extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry1_id',
        'entry2_id',
        'type',
        'description',
        'resolved',
        'resolution_notes',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'resolved' => 'boolean',
    ];

    /**
     * Get the first timetable entry involved in the conflict.
     */
    public function entry1()
    {
        return $this->belongsTo(TimetableEntry::class, 'entry1_id');
    }

    /**
     * Get the second timetable entry involved in the conflict.
     */
    public function entry2()
    {
        return $this->belongsTo(TimetableEntry::class, 'entry2_id');
    }

    /**
     * Get all affected entities based on conflict type.
     */
    public function getAffectedEntities()
    {
        $result = [];
        
        if ($this->type === 'ROOM') {
            // Load the room if needed
            if (!$this->entry1->relationLoaded('room')) {
                $this->entry1->load('room');
            }
            $result['room'] = $this->entry1->room;
        } elseif ($this->type === 'LECTURER') {
            // Load the lecturer if needed
            if (!$this->entry1->relationLoaded('lecturer')) {
                $this->entry1->load('lecturer.user');
            }
            $result['lecturer'] = $this->entry1->lecturer;
        }

        // Always load the courses
        if (!$this->entry1->relationLoaded('course')) {
            $this->entry1->load('course');
        }
        if (!$this->entry2->relationLoaded('course')) {
            $this->entry2->load('course');
        }
        
        $result['courses'] = [
            $this->entry1->course,
            $this->entry2->course
        ];

        return $result;
    }
}