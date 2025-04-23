<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Faculty;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FacultyController extends Controller
{
    /**
     * Display a listing of the faculties.
     *
     * @return \Illuminate\Http\Response
     */
    // public function index()
    // {
    //     // Fetch all faculties
    //     $faculties = Faculty::all();
        
    //     return Inertia::render('Faculty', [
    //         'faculties' => $faculties,
    //         'isAdmin' => Auth::user()->isAdmin(), // Pass admin status for UI permissions
    //     ]);
    // }

    public function index(Request $request)
    {
        \Log::info('Fetching faculties');
        $faculties = Faculty::all();
        \Log::info('Faculties:', $faculties->toArray());
    
        // Check if the request expects an Inertia response
        if ($request->header('X-Inertia')) {
            return Inertia::render('Faculty', [
                'faculties' => $faculties,
                'isAdmin' => Auth::user()->isAdmin(),
            ]);
        }
    
        // Return JSON for API requests
        return response()->json($faculties);
    }

    /**
     * Store a newly created faculty in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:faculties',
        ]);

        $faculty = Faculty::create($validated);

        return response()->json($faculty, 201);
    }

    /**
     * Display the specified faculty.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $faculty = Faculty::findOrFail($id);
        return response()->json($faculty);
    }

    /**
     * Update the specified faculty in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $faculty = Faculty::findOrFail($id);

        $validated = $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:faculties,code,' . $id,
        ]);

        $faculty->update($validated);

        return response()->json($faculty);
    }

    /**
     * Remove the specified faculty from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $faculty = Faculty::findOrFail($id);
        $faculty->delete();

        return response()->json(['message' => 'Faculty deleted successfully']);
    }

    /**
     * Get all departments in this faculty.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function departments($id)
    {
        $faculty = Faculty::findOrFail($id);
        return response()->json($faculty->departments);
    }

    /**
     * Get all lecturers in this faculty.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function lecturers($id)
    {
        $faculty = Faculty::findOrFail($id);
        return response()->json($faculty->lecturers);
    }

    /**
     * Get all courses in this faculty.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function courses($id)
    {
        $faculty = Faculty::findOrFail($id);
        return response()->json($faculty->courses);
    }

    /**
     * Get all students in this faculty.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function students($id)
    {
        $faculty = Faculty::findOrFail($id);
        return response()->json($faculty->students);
    }
}