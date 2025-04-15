<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_id',
        'department_id',
        'year_of_study',
        'program',
    ];

    /**
     * Get the user that owns the student profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the department that the student belongs to.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the faculty through the department.
     */
    public function faculty()
    {
        return $this->hasOneThrough(
            Faculty::class,
            Department::class,
            'id',
            'id',
            'department_id',
            'faculty_id'
        );
    }

    /**
     * Get the courses enrolled by the student.
     */
    public function courses()
    {
        return $this->belongsToMany(Course::class, 'enrollments')
            ->withPivot('academic_year', 'semester')
            ->withTimestamps();
    }

    /**
     * Get the enrollments for the student.
     */
    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    /**
     * Get the full name of the student.
     */
    public function getFullNameAttribute()
    {
        return $this->user->full_name;
    }

    /**
     * Get the email of the student.
     */
    public function getEmailAttribute()
    {
        return $this->user->email;
    }
}