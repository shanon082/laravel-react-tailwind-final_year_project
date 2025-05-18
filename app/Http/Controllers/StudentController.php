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
    public function courses(Request $request)
    {
        $student = auth()->user()->student;
        
        if (!$student) {
            return response()->json([]);
        }

        $query = Course::query()
            ->where('department_id', $student->department_id)
            ->where('year_of_study', $student->year_of_study);

        $courses = $query->with(['lecturer:id,fullName,title', 'department:id,name'])
            ->get()
            ->map(function ($course) {
                return [
                    'id' => $course->id,
                    'code' => $course->code,
                    'name' => $course->name,
                    'credits' => $course->credit_units,
                    'lecturer' => $course->lecturer ? "{$course->lecturer->title} {$course->lecturer->fullName}" : 'Not Assigned',
                    'schedule' => $this->formatSchedule($course->schedule),
                    'room' => $this->formatRoom($course->schedule),
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

    /**
     * Get student information
     */
    public function info()
    {
        $student = auth()->user()->student;
        return response()->json([
            'year_of_study' => $student ? $student->year_of_study : null,
            'department_id' => $student ? $student->department_id : null,
        ]);
    }

    /**
     * Update student information
     */
    public function updateInfo(Request $request)
    {
        $request->validate([
            'year_of_study' => 'required|integer|min:1|max:4',
            'department_id' => 'required|exists:departments,id',
        ]);

        $student = auth()->user()->student;
        
        if (!$student) {
            $student = new Student([
                'user_id' => auth()->id(),
                'year_of_study' => $request->year_of_study,
                'department_id' => $request->department_id,
            ]);
            $student->save();
        } else {
            $student->update([
                'year_of_study' => $request->year_of_study,
                'department_id' => $request->department_id,
            ]);
        }

        return response()->json([
            'message' => 'Student information updated successfully',
            'student' => $student,
        ]);
    }

    /**
     * Format schedule for display
     */
    private function formatSchedule($scheduleEntries)
    {
        if (!$scheduleEntries || $scheduleEntries->isEmpty()) {
            return 'Schedule not set';
        }
        
        return $scheduleEntries
            ->map(fn($entry) => "{$entry->day} {$entry->start_time} - {$entry->end_time}")
            ->join(', ');
    }

    /**
     * Format room for display
     */
    private function formatRoom($scheduleEntries)
    {
        if (!$scheduleEntries || $scheduleEntries->isEmpty()) {
            return 'Room not assigned';
        }
        
        return $scheduleEntries
            ->pluck('room.name')
            ->unique()
            ->filter()
            ->join(', ') ?: 'Room not assigned';
    }
} 