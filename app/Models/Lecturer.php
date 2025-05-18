<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lecturer extends Model
{
    use HasFactory;

    protected $fillable = [
        'username',
        'fullName',
        'email',
        'department_id',
        'contact',
        'title',
    ];

    /**
     * Get the department that this lecturer belongs to
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    public function availability()
    {
        return $this->hasMany(LecturerAvailability::class,'lecturer_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}