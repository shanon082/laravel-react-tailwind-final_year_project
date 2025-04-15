<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the departments.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $departments = Department::with('faculty')->get();
        return response()->json($departments);
    }

    /**
     * Store a newly created department in storage.
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
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:departments',
            'faculty_id' => 'required|exists:faculties,id',
            'description' => 'nullable|string',
        ]);

        $department = Department::create($validated);
        $department->load('faculty');

        return response()->json($department, 201);
    }

    /**
     * Display the specified department.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $department = Department::with('faculty')->findOrFail($id);
        return response()->json($department);
    }

    /**
     * Update the specified department in storage.
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

    /**
     * Remove the specified department from storage.
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

        $department = Department::findOrFail($id);
        $department->delete();

        return response()->json(['message' => 'Department deleted successfully']);
    }

    /**
     * Get all lecturers in this department.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function lecturers($id)
    {
        $department = Department::findOrFail($id);
        $lecturers = $department->lecturers()->with('user')->get();
        return response()->json($lecturers);
    }

    /**
     * Get all courses in this department.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function courses($id)
    {
        $department = Department::findOrFail($id);
        return response()->json($department->courses);
    }

    /**
     * Get all students in this department.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function students($id)
    {
        $department = Department::findOrFail($id);
        $students = $department->students()->with('user')->get();
        return response()->json($students);
    }
}