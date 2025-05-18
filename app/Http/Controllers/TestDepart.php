<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TestDepart extends Controller
{
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $query = Department::with('faculty');
    
        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
    
        $departments = $query->paginate($perPage)->through(function ($department) {
            return [
                'id' => $department->id,
                'name' => $department->name,
                'code' => $department->code,
                'faculty' => $department->faculty ? [
                    'id' => $department->faculty->id,
                    'name' => $department->faculty->name,
                ] : null,
                'faculty_id' => $department->faculty_id,
            ];
        });
    
        if ($request->header('X-Inertia')) {
            return Inertia::render('Departments', [
                'departments' => [
                    'data' => $departments->items(),
                    'current_page' => $departments->currentPage(),
                    'last_page' => $departments->lastPage(),
                    'total' => $departments->total(),
                ],
                'auth' => auth()->user(),
                'filters' => [
                    'search' => $request->search ?? '',
                ],
            ]);
        }
    
        return response()->json([
            'data' => $departments->items(),
            'current_page' => $departments->currentPage(),
            'last_page' => $departments->lastPage(),
            'total' => $departments->total(),
        ]);
    }

    public function store(Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:departments',
            'faculty_id' => 'required|exists:faculties,id',
        ]);

        $department = Department::create($validated);
        $department->load('faculty');

        return response()->json($department, 201);
    }

    public function show($id)
    {
        $department = Department::with('faculty')->findOrFail($id);
        return response()->json($department);
    }

    public function update(Request $request, $id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:departments,code,' . $id,
            'faculty_id' => 'exists:faculties,id',
            'description' => 'nullable|string',
        ]);

        $department->update($validated);
        $department->load('faculty');

        return response()->json($department);
    }

    public function destroy($id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }

    public function lecturers($id)
    {
        $department = Department::findOrFail($id);
        $lecturers = $department->lecturers()->with('user')->get();
        return response()->json($lecturers);
    }

    public function courses($id)
    {
        $department = Department::findOrFail($id);
        return response()->json($department->courses);
    }

    public function students($id)
    {
        $department = Department::findOrFail($id);
        $students = $department->students()->with('user')->get();
        return response()->json($students);
    }

    /**
     * Get all departments for dropdown.
     */
    public function departmentsList()
    {
        try {
            $departments = Department::select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(function ($department) {
                    return [
                        'id' => $department->id,
                        'name' => $department->name
                    ];
                });

            \Log::info('Departments fetched for dropdown', [
                'count' => $departments->count(),
                'data' => $departments
            ]);

            return response()->json($departments);
        } catch (\Exception $e) {
            \Log::error('Error fetching departments', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Failed to fetch departments'], 500);
        }
    }
}