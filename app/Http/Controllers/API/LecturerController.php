<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class LecturerController extends Controller
{
    /**
     * Display a listing of all lecturers.
     *
     * @return \Inertia\Response|\Illuminate\Http\JsonResponse
     */
    public function index()
    {
        return Inertia::render('Lecturers');
    }

    /**
     * Store a newly created lecturer in storage.
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

        $request->validate([
            'username' => 'required|string|unique:users',
            'full_name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users',
            'password' => 'required|string|min:8',
            'department' => 'required|string',
            'title' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            // Create user with LECTURER role
            $user = User::create([
                'username' => $request->username,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => 'lecturer',
                'department' => $request->department,
            ]);

            // Create lecturer profile
            $lecturer = Lecturer::create([
                'user_id' => $user->id,
                'department' => $request->department,
                'title' => $request->title,
            ]);

            // Load user relationship
            $lecturer->load('user');

            DB::commit();

            return response()->json($lecturer, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating lecturer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified lecturer.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $lecturer = Lecturer::with('user')->findOrFail($id);
        return response()->json($lecturer);
    }

    /**
     * Update the specified lecturer in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Check if user is admin or the lecturer being updated
        $lecturer = Lecturer::findOrFail($id);
        if (!Auth::user()->isAdmin() && Auth::id() !== $lecturer->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'string',
            'department' => 'string',
            'full_name' => 'string|max:255',
            'email' => 'string|email|unique:users,email,' . $lecturer->user_id,
        ]);

        try {
            DB::beginTransaction();

            // Update lecturer-specific fields
            $lecturer->title = $validated['title'] ?? $lecturer->title;
            $lecturer->department = $validated['department'] ?? $lecturer->department;
            $lecturer->save();

            // Update user fields if provided
            if (isset($validated['full_name']) || isset($validated['email'])) {
                $user = $lecturer->user;
                if (isset($validated['full_name'])) {
                    $user->full_name = $validated['full_name'];
                }
                if (isset($validated['email'])) {
                    $user->email = $validated['email'];
                }
                $user->save();
            }

            // Update password if provided (admin only)
            if (Auth::user()->isAdmin() && $request->has('password')) {
                $request->validate(['password' => 'string|min:8']);
                $user = $lecturer->user;
                $user->password = Hash::make($request->password);
                $user->save();
            }

            DB::commit();

            // Reload user relationship
            $lecturer->load('user');

            return response()->json($lecturer);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating lecturer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified lecturer from storage.
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

        $lecturer = Lecturer::findOrFail($id);
        $userId = $lecturer->user_id;

        try {
            DB::beginTransaction();

            // Delete lecturer record
            $lecturer->delete();

            // Delete user record
            User::destroy($userId);

            DB::commit();

            return response()->json(['message' => 'Lecturer deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting lecturer: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all courses taught by this lecturer.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function courses($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer->courses);
    }

    /**
     * Get all timetable entries for this lecturer.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function timetableEntries($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        $entries = $lecturer->timetableEntries()->with(['course', 'room', 'timeSlot'])->get();
        return response()->json($entries);
    }

    /**
     * Get all availability records for this lecturer.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function availability($id)
    {
        $lecturer = Lecturer::findOrFail($id);
        return response()->json($lecturer->availability);
    }
}