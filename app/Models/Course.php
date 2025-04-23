<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'credit_units',
        'department',
        'lecturer',
        'is_elective',
        'color_code',
        'year_level',
        'semester',
    ];

    protected $casts = [
        'is_elective' => 'boolean',
    ];

    /**
     * Get the department this course belongs to
     */
    public function department()
    {
        return $this->belongsTo(Department::class, 'department', 'id');
    }

    /**
     * Get the lecturer assigned to this course
     */
    public function lecturer()
    {
        return $this->belongsTo(Lecturer::class, 'lecturer', 'id');
    }

    /**
     * Get the lecturers teaching this course through timetable entries
     */
    public function timetableLecturers()
    {
        return $this->hasManyThrough(
            Lecturer::class,
            TimetableEntry::class,
            'course_id',
            'id',
            'id',
            'lecturer_id'
        )->distinct();
    }

    /**
     * Get the timetable entries for this course
     */
    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    /**
     * Get the student enrollments for this course
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the students enrolled in this course
     */
    public function students()
    {
        return $this->belongsToMany(Student::class, 'enrollments')
            ->withPivot('academic_year', 'semester')
            ->withTimestamps();
    }

    /**
     * Get the feedback related to this course
     */
    public function feedback()
    {
        return $this->hasMany(Feedback::class);
    }
}