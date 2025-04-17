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

        return redirect()->route('rooms');
    }

    public function destroy($id)
    {
        $room = Room::findOrFail($id);
        $room->delete();

        return response()->json(['message' => 'Room deleted successfully']);
    }
}