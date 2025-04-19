<?php

// app/Http/Controllers/LecturerController.php
namespace App\Http\Controllers;

use App\Models\Lecturer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LecturerController extends Controller
{
    public function index(Request $request)
    {
        $query = Lecturer::query();

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->input('per_page', 10);
        $lecturers = $query->select('id', 'name', 'department', 'title', 'contact_number')
                           ->paginate($perPage);

        if ($request->header('X-Inertia')) {
            return Inertia::render('Lecturers', [
                'auth' => auth()->user(),
                'lecturersResponse' => [
                    'data' => $lecturers->items(),
                    'current_page' => $lecturers->currentPage(),
                    'last_page' => $lecturers->lastPage(),
                    'total' => $lecturers->total(),
                ],
                'filters' => [
                    'search' => $request->search ?? '',
                ],
            ]);
        }

        return response()->json([
            'data' => $lecturers->items(),
            'current_page' => $lecturers->currentPage(),
            'last_page' => $lecturers->lastPage(),
            'total' => $lecturers->total(),
        ]);
    }
    public function show($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer);
    }
    public function store(Request $request)
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'department' => 'required|string',
            'title' => 'required|string',
            'contactNumber' => 'required|string',
        ]);

        $lecturer = Lecturer::create($validated);

        return redirect()->route('lecturers')->with('success', 'Lecturer created successfully.');
    }

    public function update(Request $request, $id)
    {
        $lecturer = Lecturer::findOrFail($id);
        $validated = $request->validate([
            'department' => 'required|string',
            'title' => 'required|string',
            'contactNumber' => 'required|string',
        ]);

        $lecturer->update($validated);
        return redirect()->route('lecturers')->with('success', 'Lecturer updated successfully.');
    }

    public function destroy($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        $lecturer->delete();
        return redirect()->route('lecturers')->with('success', 'Lecturer deleted successfully.');
    }
    public function courses($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return $lecturer->courses;
    }
    public function timetableEntries($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return $lecturer->timetableEntries;
    }
    public function coursesTimetableEntries($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return $lecturer->courses->map(function ($course) {
            return [
                'course' => $course,
                'timetableEntries' => $course->timetableEntries,
            ];
        });
    }
    public function availability($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return $lecturer->availability;
    }
}