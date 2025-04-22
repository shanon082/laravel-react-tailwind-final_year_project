<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Faculty extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
    ];

    /**
     * Get the departments belonging to this faculty.
     */
    public function departments()
    {
        return $this->hasMany(Department::class);
    }

    /**
     * Get the dean of this faculty (user with dean role in this faculty).
     */
    public function dean()
    {
        return $this->hasOne(User::class, 'faculty_id')
            ->where('role', 'DEAN');
    }

    /**
     * Get all lecturers in this faculty through departments.
     */
    public function lecturers()
    {
        return $this->hasManyThrough(
            Lecturer::class,
            Department::class,
            'faculty_id',
            'department_id'
        );
    }

    /**
     * Get all courses in this faculty through departments.
     */
    public function courses()
    {
        return $this->hasManyThrough(
            Course::class,
            Department::class,
            'faculty_id',
            'department_id'
        );
    }

    /**
     * Get all students in this faculty through departments.
     */
    public function students()
    {
        return $this->hasManyThrough(
            Student::class,
            Department::class,
            'faculty_id',
            'department_id'
        );
    }
}