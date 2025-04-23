<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'faculty_id',
    ];

    /**
     * Get the faculty that owns the department.
     */
    public function faculty()
    {
        return $this->belongsTo(Faculty::class);
    }

    /**
     * Get the head of department (user with HOD role in this department).
     */
    public function headOfDepartment()
    {
        return $this->hasOne(User::class, 'department_id')
            ->where('role', 'HOD');
    }

    /**
     * Get all lecturers in this department.
     */
    public function lecturers()
    {
        return $this->hasMany(Lecturer::class);
    }

    /**
     * Get all courses in this department.
     */
    public function courses()
    {
        return $this->hasMany(Course::class, 'department', 'code');
    }

    /**
     * Get all students in this department.
     */
    public function students()
    {
        return $this->hasMany(Student::class);
    }
}