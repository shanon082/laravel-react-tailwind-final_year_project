<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class RoomController extends Controller
{
    /**
     * Display a listing of all rooms.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return Inertia::render('Rooms');
    }


    /**
     * Store a newly created room in storage.
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
        'name' => 'required|string|max:255|unique:rooms',
        'type' => 'required|string|in:Lecture Hall,Laboratory,Seminar Room,Computer Lab',
        'capacity' => 'required|integer|min:1',
        'building' => 'required|string|max:255',
    ]);

    $room = Room::create($validated);

    return response()->json($room, 201);
}

public function update(Request $request, $id)
{
    if (!Auth::user()->isAdmin()) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $room = Room::findOrFail($id);

    $validated = $request->validate([
        'name' => 'required|string|max:255|unique:rooms,name,' . $id,
        'type' => 'required|string|in:Lecture Hall,Laboratory,Seminar Room,Computer Lab',
        'capacity' => 'required|integer|min:1',
        'building' => 'required|string|max:255',
    ]);

    $room->update($validated);

    return response()->json($room);
}

    /**
     * Display the specified room.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $room = Room::findOrFail($id);
        return response()->json($room);
    }

    /**
     * Update the specified room in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */


    /**
     * Remove the specified room from storage.
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

        $room = Room::findOrFail($id);
        $room->delete();

        return response()->json(['message' => 'Room deleted successfully']);
    }

    /**
     * Get all timetable entries for this room.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function timetableEntries($id)
    {
        $room = Room::findOrFail($id);
        $entries = $room->timetableEntries()->with(['course', 'lecturer.user', 'timeSlot'])->get();
        return response()->json($entries);
    }

    /**
     * Get room availability based on timetable entries.
     *
     * @param  int  $id
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function availability(Request $request, $id)
    {
        $room = Room::findOrFail($id);
        
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string',
        ]);

        $academicYear = $request->academic_year;
        $semester = $request->semester;

        // Get all time slots
        $timeSlots = \App\Models\TimeSlot::all();
        
        // Get all entries for this room in the specified academic year and semester
        $entries = $room->timetableEntries()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->get()
            ->groupBy('day');

        // Prepare availability structure
        $availability = [];
        foreach (\App\Models\Day::cases() as $day) {
            $dayName = $day->value;
            $availability[$dayName] = [];
            
            foreach ($timeSlots as $timeSlot) {
                $isAvailable = true;
                
                // Check if there's an entry for this day and time slot
                if (isset($entries[$dayName])) {
                    foreach ($entries[$dayName] as $entry) {
                        if ($entry->time_slot_id === $timeSlot->id) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }
                
                $availability[$dayName][] = [
                    'time_slot_id' => $timeSlot->id,
                    'start_time' => $timeSlot->start_time,
                    'end_time' => $timeSlot->end_time,
                    'is_available' => $isAvailable
                ];
            }
        }

        return response()->json($availability);
    }
}