<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use App\Models\LecturerAvailability;
use Illuminate\Http\Request;

class LecturerController extends Controller
{
    public function index(Request $request)
    {
        return Lecturer::with('user')
            ->when($request->search, function($query, $search) {
                $query->whereHas('user', function($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
                })->orWhere('department', 'like', "%{$search}%");
            })
            ->get()
            ->map(function ($lecturer) {
                return [
                    'id' => $lecturer->id,
                    'title' => $lecturer->title,
                    'department' => $lecturer->department,
                    'user' => [
                        'full_name' => $lecturer->user->full_name,
                        'email' => $lecturer->user->email,
                    ],
                ];
            });
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'department' => 'required|string',
            'title' => 'required|string',
            'contactNumber' => 'required|string',
        ]);

        try {
            $lecturer = Lecturer::create($validated);
            return response()->json($lecturer, 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create lecturer',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $lecturer = Lecturer::with('user')->findOrFail($id);
        return [
            'id' => $lecturer->id,
            'title' => $lecturer->title,
            'department' => $lecturer->department,
            'userDetails' => [
                'fullName' => $lecturer->user->full_name,
                'email' => $lecturer->user->email,
                'department' => $lecturer->department,
            ],
        ];
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
        return $lecturer;
    }

    public function destroy($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        $lecturer->delete();
        return response()->json(['message' => 'Lecturer deleted']);
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
