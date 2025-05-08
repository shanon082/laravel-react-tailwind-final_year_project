<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DepartmentController extends Controller
{
    public function index(Request $request)
{
    $departments = Department::with('faculty')->get()->map(function ($department) {
        return [
            'id' => $department->id,
            'name' => $department->name,
            'code' => $department->code,
            'faculty' => $department->faculty ? [
                'id' => $department->faculty->id,
                'name' => $department->faculty->name,
            ] : null,
        ];
    });

    return Inertia::render('Departments', [
        'departments' => $departments,
        'auth' => auth()->user(),
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
}