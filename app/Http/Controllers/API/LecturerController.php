<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use App\Models\LecturerAvailability;
use Illuminate\Container\Attributes\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LecturerController extends Controller
{
    public function index()
    {
        return Inertia::render('Lecturers', [
            'lecturers' => Lecturer::with('user')->get(),
        ]);
    }
    public function store(Request $request)
    {
        if(!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'department' => 'required|string',
            'title' => 'required|string',
            'contactNumber' => 'required|string',
        ]);

        $lecturer = Lecturer::create($validated);

        return response()->json($lecturer, 201);
    }

    public function show($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer);
    }

    public function update(Request $request, $id)
    {
        if(!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $lecturer = Lecturer::findOrFail($id);
        $validated = $request->validate([
            'department' => 'required|string',
            'title' => 'required|string',
            'contactNumber' => 'required|string',
        ]);

        $lecturer->update($validated);
        return $lecturer;
    }

    public function destroy($id)
    {
        if(!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $lecturer = Lecturer::findOrFail($id);
        $lecturer->delete();
        return response()->json(['message' => 'Lecturer deleted successfully']);
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

    public function availability($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return $lecturer->availability;
    }

    public function storeAvailability(Request $request, $id)
    {
        $validated = $request->validate([
            'day' => 'required|in:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
            'startTime' => 'required|date_format:H:i:s',
            'endTime' => 'required|date_format:H:i:s|after:startTime',
        ]);

        return LecturerAvailability::create([
            'lecturer_id' => $id,
            'day' => $validated['day'],
            'start_time' => $validated['startTime'],
            'end_time' => $validated['endTime'],
        ]);
    }

    public function destroyAvailability($availabilityId)
    {
        $availability = LecturerAvailability::findOrFail($availabilityId);
        $availability->delete();
        return response()->json(['message' => 'Availability deleted']);
    }
}
