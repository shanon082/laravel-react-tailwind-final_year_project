<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CourseController extends Controller
{
    public function index(Request $request)
    {
        $query = Course::query();
        if ($request->has('search')) {
            $query->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
        }
        $courses = $query->paginate(10);

        return Inertia::render('Courses', [
            'courses' => $courses,
        ]);
    }

    public function show($id, Request $request)
    {
        $course = Course::findOrFail($id);

        if ($request->header('X-Inertia')) {
            return Inertia::render('Courses', [
                'course' => $course,
                'courses' => Course::paginate(10), // Preserve course list
            ]);
        }

        return response()->json($course);
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

        Course::create($validated);

        return redirect()->route('courses')->with('success', 'Course created successfully');
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

        return redirect()->route('courses')->with('success', 'Course updated successfully');
    }

    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return redirect()->route('courses')->with('success', 'Course deleted successfully');
    }
}