<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index(){
        return Inertia::render('Courses');
    }

    public function store(Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses',
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'isElective' => 'boolean',
            'colorCode' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'yearLevel' => 'required|integer|min:1|max:6',
        ]);

        try {
            $course = Course::create($validated);
            return response()->json($course, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses,code,' . $id,
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'isElective' => 'boolean',
            'colorCode' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'yearLevel' => 'required|integer|min:1|max:6',
        ]);

        $course->update($validated);
        return $course;
    }

    public function destroy($id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $course = Course::findOrFail($id);
        $course->delete();
        return response()->json(['message' => 'Course deleted']);
    }

    public function lecturers($id)
    {
        $course = Course::findOrFail($id);
        return $course->lecturers;
    }

    public function timetableEntries($id)
    {
        $course = Course::findOrFail($id);
        return $course->timetableEntries;
    }

    public function students($id)
    {
        $course = Course::findOrFail($id);
        return $course->students;
    }
}
