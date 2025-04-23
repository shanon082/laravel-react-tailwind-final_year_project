<?php

namespace App\Http\Controllers;

use App\Models\Lecturer;
use App\Models\LecturerAvailability; // Updated to use LecturerAvailability
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\TimeSlot;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class LecturerController extends Controller
{
    public function index(Request $request)
    {
        $query = Lecturer::query();

        if ($request->has('search') && $request->search) {
            $query->where('fullName', 'like', '%' . $request->search . '%');
        }

        $perPage = $request->input('per_page', 10);
        $lecturers = $query->select('id', 'username', 'fullName', 'email', 'department', 'contact', 'title')
                           ->paginate($perPage);

        if ($request->header('X-Inertia')) {
            return Inertia::render('Lecturers', [
                'lecturers' => Lecturer::all()->map(function ($lecturer) {
                    return [
                        'id' => $lecturer->id,
                        'username' => $lecturer->username,
                        'fullName' => $lecturer->fullName,
                        'email' => $lecturer->email,
                        'department' => $lecturer->department,
                        'contact' => $lecturer->contact,
                        'title' => $lecturer->title,
                    ];
                }),
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

    public function store(Request $request)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'username' => 'required|string|unique:lecturers,username',
            'fullName' => 'required|string|max:255',
            'email' => 'required|string|email|unique:lecturers,email',
            'department' => 'required|string',
            'contact' => 'required|string',
            'title' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            $lecturer = Lecturer::create([
                'username' => $validated['username'],
                'fullName' => $validated['fullName'],
                'email' => $validated['email'],
                'department' => $validated['department'],
                'contact' => $validated['contact'],
                'title' => $validated['title'],
            ]);

            DB::commit();

            if ($request->header('X-Inertia')) {
                return redirect()->route('lecturers')->with('success', 'Lecturer added successfully.');
            }

            return response()->json($lecturer, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['error' => 'Error creating lecturer: ' . $e->getMessage()]);
            }
            return response()->json(['message' => 'Error creating lecturer: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer);
    }

    public function update(Request $request, $id)
    {
        $lecturer = Lecturer::findOrFail($id);
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'username' => 'string|unique:lecturers,username,' . $lecturer->id,
            'title' => 'string',
            'department' => 'string',
            'fullName' => 'string|max:255',
            'email' => 'string|email|unique:lecturers,email,' . $lecturer->id,
            'contact' => 'string',
        ]);

        try {
            DB::beginTransaction();

            $lecturer->username = $validated['username'] ?? $lecturer->username;
            $lecturer->title = $validated['title'] ?? $lecturer->title;
            $lecturer->department = $validated['department'] ?? $lecturer->department;
            $lecturer->fullName = $validated['fullName'] ?? $lecturer->fullName;
            $lecturer->email = $validated['email'] ?? $lecturer->email;
            $lecturer->contact = $validated['contact'] ?? $lecturer->contact;
            $lecturer->save();

            DB::commit();

            if ($request->header('X-Inertia')) {
                return redirect()->route('lecturers')->with('success', 'Lecturer updated successfully.');
            }

            return response()->json($lecturer);
        } catch (\Exception $e) {
            DB::rollBack();
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors(['error' => 'Error updating lecturer: ' . $e->getMessage()]);
            }
            return response()->json(['message' => 'Error updating lecturer: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $lecturer = Lecturer::findOrFail($id);

        try {
            DB::beginTransaction();

            $lecturer->delete();

            DB::commit();

            if (request()->header('X-Inertia')) {
                return redirect()->route('lecturers')->with('success', 'Lecturer deleted successfully.');
            }

            return response()->json(['message' => 'Lecturer deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            if (request()->header('X-Inertia')) {
                return redirect()->back()->withErrors(['error' => 'Error deleting lecturer: ' . $e->getMessage()]);
            }
            return response()->json(['message' => 'Error deleting lecturer: ' . $e->getMessage()], 500);
        }
    }

    public function courses($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer->courses);
    }

    public function timetableEntries($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        $entries = $lecturer->timetableEntries()->with(['course', 'room', 'timeSlot'])->get();
        return response()->json($entries);
    }

    public function availability($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer->availability);
    }

    public function storeAvailability(Request $request, $lecturerId)
    {
        $validated = $request->validate([
            'day' => 'required|string|in:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
        ]);
    
        $availability = LecturerAvailability::create([
            'lecturer_id' => $lecturerId,
            'day' => $validated['day'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);
    
        return response()->json($availability, 201);
    }

    public function destroyAvailability($id)
{
    $availability = LecturerAvailability::findOrFail($id);
    $availability->delete();
    
    return response()->json(['message' => 'Availability deleted successfully']);
}
}