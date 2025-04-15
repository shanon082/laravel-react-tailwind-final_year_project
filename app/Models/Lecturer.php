<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lecturer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'department',
        'title',
    ];

    /**
     * Get the user that owns the lecturer profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the availability records for the lecturer.
     */
    public function availability()
    {
        return $this->hasMany(LecturerAvailability::class);
    }

    /**
     * Get the timetable entries for this lecturer.
     */
    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    /**
     * Get the courses taught by this lecturer through timetable entries.
     */
    public function courses()
    {
        return $this->hasManyThrough(
            Course::class,
            TimetableEntry::class,
            'lecturer_id',
            'id', 
            'id',
            'course_id'
        )->distinct();
    }

    /**
     * Get the full name of the lecturer.
     */
    public function getFullNameAttribute()
    {
        return $this->user->full_name;
    }

    /**
     * Get the email of the lecturer.
     */
    public function getEmailAttribute()
    {
        return $this->user->email;
    }
}