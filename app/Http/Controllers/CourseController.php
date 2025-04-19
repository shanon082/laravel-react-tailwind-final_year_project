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

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->has('department') && $request->department) {
            $query->where('department', $request->department);
        }
        if ($request->has('year_level') && $request->yearLevel) {
            $query->where('year_level', $request->yearLevel);
        }

        $perPage = $request->input('per_page', 10);
        $courses = $query->select('id', 'code', 'name', 'department', 'is_elective', 'color_code', 'year_level')
                         ->paginate($perPage);

        if ($request->header('X-Inertia')) {
            return Inertia::render('Courses', [
                'auth' => auth()->user(),
                'coursesResponse' => [
                    'data' => $courses->items(),
                    'current_page' => $courses->currentPage(),
                    'last_page' => $courses->lastPage(),
                    'total' => $courses->total(),
                ],
                'filters' => [
                    'search' => $request->search ?? '',
                    'department' => $request->department ?? '',
                    'yearLevel' => $request->yearLevel ?? '',
                ],
            ]);
        }

        return response()->json([
            'data' => $courses->items(),
            'current_page' => $courses->currentPage(),
            'last_page' => $courses->lastPage(),
            'total' => $courses->total(),
        ]);
    }

    public function show($id)
    {
        $course = Course::findOrFail($id);

        return response()->json($course);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses',
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'is_elective' => 'boolean',
            'color_code' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'year_level' => 'required|integer|min:1|max:6',
        ]);

        Course::create($validated);

        return redirect()->route('courses');
    }

    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses,code,' . $id,
            'name' => 'required|string|min:3',
            'department' => 'required|string',
            'is_elective' => 'boolean',
            'color_code' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'year_level' => 'required|integer|min:1|max:6',
        ]);

        $course->update($validated);

        return back()->route('courses')->with('success', 'Course updated successfully');
    }

    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return redirect()->route('courses')->with('success', 'Course deleted successfully');
    }
}