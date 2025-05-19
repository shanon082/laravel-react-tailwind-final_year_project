<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Enrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'semester' => 'integer',
    ];

    /**
     * Get the student that owns the enrollment.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the course that the student is enrolled in.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get all timetable entries for this course in the same academic year and semester.
     */
    public function timetableEntries()
    {
        return TimetableEntry::where('course_id', $this->course_id)
            ->where('academic_year', $this->academic_year)
            ->where('semester', $this->semester)
            ->get();
    }
}