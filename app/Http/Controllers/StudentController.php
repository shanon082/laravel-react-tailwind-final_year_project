<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\Course;
use App\Models\Assignment;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentController extends Controller
{
    /**
     * Get the student's enrolled courses for the current semester
     */
    public function courses($id)
    {
        // Ensure the student exists and the user has permission to view their data
        $student = Student::findOrFail($id);
        if (Auth::id() !== $student->user_id && !Auth::user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get enrolled courses with related data
        $courses = $student->courses()
            ->with(['lecturer:id,fullName,title', 'department:id,name'])
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'code' => $course->code,
                    'name' => $course->name,
                    'credit_units' => $course->credit_units,
                    'is_elective' => $course->is_elective,
                    'lecturer' => $course->lecturer,
                    'department' => $course->department,
                    'enrollments' => $course->enrollments->count(),
                ];
            });

        return response()->json($courses);
    }

    /**
     * Get the student's assignments
     */
    public function assignments($id)
    {
        // Ensure the student exists and the user has permission to view their data
        $student = Student::findOrFail($id);
        if (Auth::id() !== $student->user_id && !Auth::user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get assignments for enrolled courses
        $assignments = Assignment::whereHas('course', function ($query) use ($student) {
            $query->whereHas('students', function ($q) use ($student) {
                $q->where('students.id', $student->id);
            });
        })
        ->with(['course:id,code,name'])
        ->get()
        ->map(function ($assignment) {
            return [
                'id' => $assignment->id,
                'title' => $assignment->title,
                'description' => $assignment->description,
                'due_date' => $assignment->due_date,
                'course' => $assignment->course,
                'status' => $assignment->status,
            ];
        });

        return response()->json($assignments);
    }

    /**
     * Get the student's timetable entries
     */
    public function timetable($id)
    {
        // Ensure the student exists and the user has permission to view their data
        $student = Student::findOrFail($id);
        if (Auth::id() !== $student->user_id && !Auth::user()->isAdmin()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Get timetable entries for enrolled courses
        $timetableEntries = TimetableEntry::whereHas('course', function ($query) use ($student) {
            $query->whereHas('students', function ($q) use ($student) {
                $q->where('students.id', $student->id);
            });
        })
        ->with(['course:id,code,name', 'room:id,name', 'lecturer:id,fullName'])
        ->get();

        return response()->json($timetableEntries);
    }
} 