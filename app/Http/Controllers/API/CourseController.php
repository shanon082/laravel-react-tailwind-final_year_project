<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query();
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
        }
        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses',
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'isElective' => 'boolean',
            'colorCode' => 'required|string',
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
        return Course::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses,code,' . $id,
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'isElective' => 'boolean',
            'colorCode' => 'required|string',
            'yearLevel' => 'required|integer|min:1|max:6',
        ]);

        $course->update($validated);
        return $course;
    }

    public function destroy($id)
    {
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
