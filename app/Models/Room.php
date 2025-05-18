<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'capacity',
        'building',
        'department_id'
    ];

    /**
     * Get the department that owns the room
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the timetable entries using this room
     */
    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    /**
     * Get the courses taught in this room through timetable entries
     */
    public function courses()
    {
        return $this->hasManyThrough(
            Course::class,
            TimetableEntry::class,
            'room_id',
            'id',
            'id',
            'course_id'
        )->distinct();
    }

    /**
     * Get the lecturers teaching in this room through timetable entries
     */
    public function lecturers()
    {
        return $this->hasManyThrough(
            Lecturer::class,
            TimetableEntry::class,
            'room_id',
            'id',
            'id',
            'lecturer_id'
        )->distinct();
    }
}