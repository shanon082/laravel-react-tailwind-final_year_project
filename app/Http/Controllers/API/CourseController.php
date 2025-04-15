<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CourseController extends Controller
{
    /**
     * Display a listing of all courses.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $courses = Course::all();
        return response()->json($courses);
    }

    /**
     * Store a newly created course in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'code' => 'required|string|unique:courses',
            'name' => 'required|string|max:255',
            'department' => 'required|string',
            'is_elective' => 'boolean',
            'color_code' => 'nullable|string',
            'year_level' => 'nullable|integer',
        ]);

        $course = Course::create($validated);

        return response()->json($course, 201);
    }

    /**
     * Display the specified course.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course);
    }

    /**
     * Update the specified course in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);

        $validated = $request->validate([
            'code' => 'string|unique:courses,code,' . $id,
            'name' => 'string|max:255',
            'department' => 'string',
            'is_elective' => 'boolean',
            'color_code' => 'nullable|string',
            'year_level' => 'nullable|integer',
        ]);

        $course->update($validated);

        return response()->json($course);
    }

    /**
     * Remove the specified course from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

    /**
     * Get all lecturers teaching this course.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function lecturers($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->lecturers);
    }

    /**
     * Get all timetable entries for this course.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function timetableEntries($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->timetableEntries);
    }

    /**
     * Get all students enrolled in this course.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function students($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->students);
    }
}