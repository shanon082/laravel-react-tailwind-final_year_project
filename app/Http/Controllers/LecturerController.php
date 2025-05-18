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
        try {
        $query = Lecturer::query();

        if ($request->has('search') && $request->search) {
                $query->where(function($q) use ($request) {
                    $q->where('fullName', 'like', '%' . $request->search . '%')
                      ->orWhere('department', 'like', '%' . $request->search . '%')
                      ->orWhere('title', 'like', '%' . $request->search . '%');
                });
        }

        $perPage = $request->input('per_page', 10);
        $lecturers = $query->select('id', 'username', 'fullName', 'email', 'department', 'contact', 'title')
                               ->orderBy('fullName')
                           ->paginate($perPage);

            $formattedLecturers = $lecturers->map(function ($lecturer) {
                    return [
                        'id' => $lecturer->id,
                        'username' => $lecturer->username,
                        'fullName' => $lecturer->fullName,
                        'email' => $lecturer->email,
                        'department' => $lecturer->department,
                        'contact' => $lecturer->contact,
                        'title' => $lecturer->title,
                    ];
            });

            $response = [
                'data' => $formattedLecturers,
                'current_page' => $lecturers->currentPage(),
                'last_page' => $lecturers->lastPage(),
                'total' => $lecturers->total(),
            ];

            if ($request->header('X-Inertia')) {
                return Inertia::render('Lecturers', [
                    'lecturersResponse' => $response,
                'auth' => [
            'id' => auth()->user()->id,
            'name' => auth()->user()->name,
            'email' => auth()->user()->email,
                        'role' => auth()->user()->isAdmin() ? 'admin' : 'lecturer',
                ],
                'filters' => [
                    'search' => $request->search ?? '',
                ],
            ]);
        }

            return response()->json($response);
        } catch (\Exception $e) {
            \Log::error('Error in LecturerController@index: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch lecturers'], 500);
        }
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

    public function myCourses()
    {
        $user = Auth::user();
        \Log::info('myCourses called', ['user_id' => $user->id, 'user_role' => $user->role]);
        
        if (!$user || !$user->lecturer) {
            \Log::warning('User not found or not a lecturer', [
                'user_exists' => !!$user,
                'has_lecturer' => $user ? !!$user->lecturer : false
            ]);
            return response()->json(['error' => 'Unauthorized or not a lecturer'], 403);
        }

        \Log::info('Found lecturer', [
            'lecturer_id' => $user->lecturer->id,
            'lecturer_name' => $user->lecturer->fullName
        ]);

        $courses = $user->lecturer->courses()
            ->with(['department:id,name'])
            ->get();

        \Log::info('Found courses', [
            'count' => $courses->count(),
            'courses' => $courses->map(fn($c) => ['id' => $c->id, 'name' => $c->name])->toArray()
        ]);

        $mappedCourses = $courses->map(function ($course) {
            return [
                'id' => $course->id,
                'code' => $course->code,
                'name' => $course->name,
                'credits' => $course->credit_units,
                'department' => $course->department ? $course->department->name : null,
                'students' => $course->enrollments()->count(),
                'schedule' => $course->timetableEntries()
                    ->with(['timeSlot', 'room'])
                    ->get()
                    ->map(function ($entry) {
                        return [
                            'day' => $entry->timeSlot->day,
                            'start_time' => $entry->timeSlot->start_time,
                            'end_time' => $entry->timeSlot->end_time,
                            'room' => $entry->room ? $entry->room->name : null
                        ];
                    })
            ];
        });

        \Log::info('Returning mapped courses', [
            'count' => $mappedCourses->count()
        ]);

        return response()->json($mappedCourses);
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
    // Ensure the lecturer exists
    $lecturer = Lecturer::findOrFail($lecturerId);

    // Check if user is authorized (admin or the lecturer themselves)
    $user = Auth::user();
    if (!$user->isAdmin() && $user->id !== $lecturerId) {
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    $validated = $request->validate([
        'day' => 'required|string|in:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
        'start_time' => 'required|date_format:H:i',
        'end_time' => 'required|date_format:H:i|after:start_time',
    ]);

    try {
        DB::beginTransaction();

        $availability = LecturerAvailability::create([
            'lecturer_id' => $lecturerId,
            'day' => $validated['day'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        DB::commit();

        // Check if the request is an Inertia request
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Availability added successfully.');
        }

        // Fallback for non-Inertia requests (e.g., API calls)
        return response()->json($availability, 201);
    } catch (\Exception $e) {
        DB::rollBack();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->withErrors(['error' => 'Error creating availability: ' . $e->getMessage()]);
        }

        return response()->json(['message' => 'Error creating availability: ' . $e->getMessage()], 500);
    }
}

public function destroyAvailability(Request $request, $id)
{
    $availability = LecturerAvailability::findOrFail($id);

    // Check if user is authorized
    $user = Auth::user();
    if (!$user->isAdmin() && $user->id !== $availability->lecturer_id) {
        if ($request->header('X-Inertia')) {
            return redirect()->back()->withErrors(['error' => 'Unauthorized']);
        }
        return response()->json(['message' => 'Unauthorized'], 403);
    }

    try {
        $availability->delete();

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Availability deleted successfully');
        }

        return response()->json(['message' => 'Availability deleted successfully']);
    } catch (\Exception $e) {
        if ($request->header('X-Inertia')) {
            return redirect()->back()->withErrors(['error' => 'Error deleting availability: ' . $e->getMessage()]);
        }
        return response()->json(['message' => 'Error deleting availability: ' . $e->getMessage()], 500);
    }
}
}