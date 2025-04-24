<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Lecturer;
use App\Models\Department;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

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
    $courses = $query->select('id', 'code', 'name', 'credit_units', 'department', 'lecturer', 'is_elective', 'color_code', 'year_level', 'semester')
                     ->with(['lecturer:id,fullName', 'department:id,name'])
                     ->paginate($perPage);

    if ($request->header('X-Inertia')) {
        return Inertia::render('Courses', [
            'coursesResponse' => [
                'data' => $courses->items(),
                'current_page' => $courses->currentPage(),
                'last_page' => $courses->lastPage(),
                'total' => $courses->total(),
            ],
            'auth' => auth()->user(),
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
        $course = Course::with(['lecturer:id,fullName', 'department:id,name'])->findOrFail($id);
        return response()->json($course);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses',
            'name' => 'required|string|min:3',
            'credit_units' => 'required|integer|min:1|max:10',
            'department' => 'required|exists:departments,id',
            'lecturer' => 'required|exists:lecturers,id',
            'is_elective' => 'boolean',
            'color_code' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'year_level' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|min:1|max:2',
        ]);

        Course::create($validated);

        return redirect()->route('courses');
    }

    public function update(Request $request, $id)
    {
        $course = Course::findOrFail($id);
        $validated = $request->validate([
            'code' => 'required|string|min:3|unique:courses,code,' . $id,
            'name' => 'required|string|min:3|max:255',
            'credit_units' => 'required|integer|min:1|max:10',
            'department' => 'required|exists:departments,id',
            'lecturer' => 'required|exists:lecturers,id',
            'is_elective' => 'boolean',
            'color_code' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'year_level' => 'required|integer|min:1|max:6',
            'semester' => 'required|integer|min:1|max:2',
        ]);

        $course->update($validated);

        return redirect()->route('courses')->with('success', 'Course updated successfully');
    }

    public function destroy($id)
    {
        $course = Course::findOrFail($id);
        $course->delete();

        return response()->json(['message' => 'Course deleted successfully']);
    }

    /**
     * Get all lecturers teaching this course through timetable entries.
     */
    public function timetableLecturers($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->timetableLecturers);
    }

    /**
     * Get all timetable entries for this course.
     */
    public function timetableEntries($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->timetableEntries);
    }

    /**
     * Get all students enrolled in this course.
     */
    public function students($id)
    {
        $course = Course::findOrFail($id);
        return response()->json($course->students);
    }

    /**
     * Get all lecturers for dropdown.
     */
    public function lecturersList()
    {
        try {
            $lecturers = Lecturer::select('id', 'fullName')->get()->toArray();
            Log::info('Lecturers fetched for dropdown', [
                'count' => count($lecturers),
                'data' => $lecturers
            ]);
            return response()->json($lecturers, 200, [], JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            Log::error('Error fetching lecturers', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch lecturers'], 500);
        }
    }

    /**
     * Get all departments for dropdown.
     */
    public function departmentsList()
    {
        try {
            $departments = Department::select('id', 'name')->get()->toArray();
            Log::info('Departments fetched for dropdown', [
                'count' => count($departments),
                'data' => $departments
            ]);
            return response()->json($departments, 200, [], JSON_PRETTY_PRINT);
        } catch (\Exception $e) {
            Log::error('Error fetching departments', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch departments'], 500);
        }
    }
}