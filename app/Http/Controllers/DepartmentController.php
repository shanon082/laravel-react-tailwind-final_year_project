<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    // public function index()
    // {
    //     // Fetch all departments with their faculties
    //     $departments = Department::with('faculty')->get();
    //     return Inertia::render('Department', [
    //         'departments' => $departments,
    //         'isAdmin' => Auth::user()->isAdmin(), // Pass admin status for UI permissions
    //     ]);
    // }

    public function index(Request $request)
    {
        \Log::info('Fetching Departments');
        $departments = Department::with('faculty')->get();
        \Log::info('Departments fetched successfully');
        \Log::info('Departments:', $departments->toArray());
    
        // Check if the request expects an Inertia response
        if ($request->header('X-Inertia')) {
            return Inertia::render('Department', [
                'departments' => $departments,
                'isAdmin' => Auth::user()->isAdmin(),
            ]);
        }
    
        // Return JSON for API requests
        return response()->json($departments);
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
            'description' => 'nullable|string',
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
}