<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Assignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'due_date',
        'course_id',
        'status',
    ];

    protected $casts = [
        'due_date' => 'datetime',
    ];

    /**
     * Get the course this assignment belongs to
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Get the student submissions for this assignment
     */
    public function submissions()
    {
        return $this->hasMany(AssignmentSubmission::class);
    }

    /**
     * Get the students who have submitted this assignment
     */
    public function submittedStudents()
    {
        return $this->belongsToMany(Student::class, 'assignment_submissions')
            ->withPivot('submitted_at', 'grade', 'feedback')
            ->withTimestamps();
    }
} 