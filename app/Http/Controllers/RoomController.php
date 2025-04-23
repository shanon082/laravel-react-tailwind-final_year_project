<?php

namespace App\Http\Controllers;

use App\Models\Room;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function index(Request $request)
    {
        $query = Room::query();

        if ($request->has('search') && $request->search) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }
        if ($request->has('type') && $request->type) {
            $query->where('type', $request->type);
        }
        if ($request->has('building') && $request->building) {
            $query->where('building', $request->building);
        }

        $perPage = $request->input('per_page', 10);
        $rooms = $query->select('id', 'name', 'type', 'building', 'capacity')
                       ->paginate($perPage);

        $buildings = Room::distinct('building')->pluck('building');

        if ($request->header('X-Inertia')) {
            return Inertia::render('Rooms', [
                'rooms' => Room::all()->map(function ($room) {
                    return [
                        'id' => $room->id,
                        'name' => $room->name,
                        'type' => $room->type,
                        'building' => $room->building,
                        'capacity' => $room->capacity,
                    ];
                }),
                'auth' => auth()->user(),
                'roomsResponse' => [
                    'data' => $rooms->items(),
                    'current_page' => $rooms->currentPage(),
                    'last_page' => $rooms->lastPage(),
                    'total' => $rooms->total(),
                    'buildings' => $buildings,
                ],
                'filters' => [
                    'search' => $request->search ?? '',
                    'type' => $request->type ?? '',
                    'building' => $request->building ?? '',
                ],
            ]);
        }

        return response()->json([
            'data' => $rooms->items(),
            'current_page' => $rooms->currentPage(),
            'last_page' => $rooms->lastPage(),
            'total' => $rooms->total(),
            'buildings' => $buildings,
        ]);
    }

    public function show($id)
    {
        $room = Room::findOrFail($id);
        return response()->json($room);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'type' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'building' => 'required|string',
        ]);

        Room::create($validated);

        return redirect()->route('rooms');
    }

    public function update(Request $request, $id)
    {
        $room = Room::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|min:2',
            'type' => 'required|string',
            'capacity' => 'required|integer|min:1',
            'building' => 'required|string',
        ]);

        $room->update($validated);

        return back()->with('success', 'Room updated.');
    }

    public function destroy($id)
    {
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