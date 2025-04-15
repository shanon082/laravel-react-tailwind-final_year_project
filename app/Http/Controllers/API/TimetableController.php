<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\TimetableEntry;
use App\Models\Conflict;
use App\Models\Notification;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\Room;
use App\Models\TimeSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TimetableController extends Controller
{
    /**
     * Display a listing of timetable entries.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = TimetableEntry::with(['course', 'lecturer.user', 'room', 'timeSlot']);

        // Apply filters
        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
        
        if ($request->has('course_id')) {
            $query->where('course_id', $request->course_id);
        }
        
        if ($request->has('lecturer_id')) {
            $query->where('lecturer_id', $request->lecturer_id);
        }
        
        if ($request->has('room_id')) {
            $query->where('room_id', $request->room_id);
        }
        
        if ($request->has('day')) {
            $query->where('day', $request->day);
        }

        $entries = $query->get();
        
        return response()->json($entries);
    }

    /**
     * Store a newly created timetable entry in storage.
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

        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'room_id' => 'required|exists:rooms,id',
            'lecturer_id' => 'required|exists:lecturers,id',
            'day' => 'required|string',
            'time_slot_id' => 'required|exists:time_slots,id',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            // Create new timetable entry
            $timetableEntry = TimetableEntry::create($validated + ['has_conflict' => false]);

            // Load relationships
            $timetableEntry->load(['course', 'room', 'lecturer.user', 'timeSlot']);

            // Check for conflicts with existing entries
            $conflicts = $this->checkForConflicts($timetableEntry);

            // If conflicts exist, update entry and create conflict records
            if (!empty($conflicts)) {
                $timetableEntry->has_conflict = true;
                $timetableEntry->conflict_type = $conflicts[0]['type'];
                $timetableEntry->save();

                foreach ($conflicts as $conflict) {
                    // Create conflict record
                    Conflict::create([
                        'entry1_id' => $timetableEntry->id,
                        'entry2_id' => $conflict['entry']->id,
                        'type' => $conflict['type'],
                        'description' => $conflict['description'],
                        'resolved' => false,
                        'academic_year' => $validated['academic_year'],
                        'semester' => $validated['semester'],
                    ]);

                    // Update conflicting entry
                    $conflictingEntry = $conflict['entry'];
                    $conflictingEntry->has_conflict = true;
                    $conflictingEntry->conflict_type = $conflict['type'];
                    $conflictingEntry->save();

                    // Create notifications for affected users
                    // For lecturer
                    Notification::create([
                        'user_id' => $timetableEntry->lecturer->user_id,
                        'title' => 'Timetable Conflict Detected',
                        'message' => "A conflict has been detected in your schedule: {$conflict['description']}",
                        'type' => 'CONFLICT',
                        'read' => false,
                        'data' => [
                            'conflict_type' => $conflict['type'],
                            'entry_id' => $timetableEntry->id,
                        ],
                    ]);
                }
            }

            DB::commit();

            $response = [
                'entry' => $timetableEntry,
                'conflicts' => $conflicts,
            ];

            return response()->json($response, 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error creating timetable entry: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified timetable entry.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $timetableEntry = TimetableEntry::with(['course', 'lecturer.user', 'room', 'timeSlot'])->findOrFail($id);
        return response()->json($timetableEntry);
    }

    /**
     * Update the specified timetable entry in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $timetableEntry = TimetableEntry::findOrFail($id);

        $validated = $request->validate([
            'course_id' => 'exists:courses,id',
            'room_id' => 'exists:rooms,id',
            'lecturer_id' => 'exists:lecturers,id',
            'day' => 'string',
            'time_slot_id' => 'exists:time_slots,id',
            'academic_year' => 'string',
            'semester' => 'string',
        ]);

        try {
            DB::beginTransaction();

            // Save original entry for conflict resolution
            $originalEntry = clone $timetableEntry;

            // Update entry
            $timetableEntry->update($validated);
            
            // Reset conflict status
            $timetableEntry->has_conflict = false;
            $timetableEntry->conflict_type = null;
            $timetableEntry->save();

            // Load relationships
            $timetableEntry->load(['course', 'room', 'lecturer.user', 'timeSlot']);

            // Delete existing conflicts for this entry
            $existingConflicts = Conflict::where('entry1_id', $id)
                ->orWhere('entry2_id', $id)
                ->get();
            
            foreach ($existingConflicts as $existingConflict) {
                // Get the other entry in the conflict
                $otherEntryId = ($existingConflict->entry1_id == $id) 
                    ? $existingConflict->entry2_id 
                    : $existingConflict->entry1_id;
                    
                $otherEntry = TimetableEntry::find($otherEntryId);
                
                if ($otherEntry) {
                    // Check if the other entry still has conflicts
                    $otherEntryConflicts = Conflict::where(function($query) use ($otherEntryId) {
                        $query->where('entry1_id', $otherEntryId)
                            ->orWhere('entry2_id', $otherEntryId);
                    })->where(function($query) use ($id) {
                        $query->where('entry1_id', '!=', $id)
                            ->where('entry2_id', '!=', $id);
                    })->count();
                    
                    if ($otherEntryConflicts == 0) {
                        // No other conflicts, reset conflict status
                        $otherEntry->has_conflict = false;
                        $otherEntry->conflict_type = null;
                        $otherEntry->save();
                    }
                }
                
                // Delete the conflict
                $existingConflict->delete();
            }

            // Check for new conflicts
            $conflicts = $this->checkForConflicts($timetableEntry);

            // If conflicts exist, update entry and create conflict records
            if (!empty($conflicts)) {
                $timetableEntry->has_conflict = true;
                $timetableEntry->conflict_type = $conflicts[0]['type'];
                $timetableEntry->save();

                foreach ($conflicts as $conflict) {
                    // Create conflict record
                    Conflict::create([
                        'entry1_id' => $timetableEntry->id,
                        'entry2_id' => $conflict['entry']->id,
                        'type' => $conflict['type'],
                        'description' => $conflict['description'],
                        'resolved' => false,
                        'academic_year' => $timetableEntry->academic_year,
                        'semester' => $timetableEntry->semester,
                    ]);

                    // Update conflicting entry
                    $conflictingEntry = $conflict['entry'];
                    $conflictingEntry->has_conflict = true;
                    $conflictingEntry->conflict_type = $conflict['type'];
                    $conflictingEntry->save();

                    // Create notifications for affected users
                    // For lecturer
                    Notification::create([
                        'user_id' => $timetableEntry->lecturer->user_id,
                        'title' => 'Timetable Conflict Detected',
                        'message' => "A conflict has been detected in your schedule: {$conflict['description']}",
                        'type' => 'CONFLICT',
                        'read' => false,
                        'data' => [
                            'conflict_type' => $conflict['type'],
                            'entry_id' => $timetableEntry->id,
                        ],
                    ]);
                }
            }

            DB::commit();

            $response = [
                'entry' => $timetableEntry,
                'conflicts' => $conflicts,
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error updating timetable entry: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified timetable entry from storage.
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

        $timetableEntry = TimetableEntry::findOrFail($id);

        try {
            DB::beginTransaction();

            // Get all conflicts related to this entry
            $conflicts = Conflict::where('entry1_id', $id)
                ->orWhere('entry2_id', $id)
                ->get();
            
            // For each conflict, update the other entry's conflict status
            foreach ($conflicts as $conflict) {
                // Get the other entry in the conflict
                $otherEntryId = ($conflict->entry1_id == $id) 
                    ? $conflict->entry2_id 
                    : $conflict->entry1_id;
                    
                $otherEntry = TimetableEntry::find($otherEntryId);
                
                if ($otherEntry) {
                    // Check if the other entry still has conflicts
                    $otherEntryConflicts = Conflict::where(function($query) use ($otherEntryId) {
                        $query->where('entry1_id', $otherEntryId)
                            ->orWhere('entry2_id', $otherEntryId);
                    })->where(function($query) use ($id) {
                        $query->where('entry1_id', '!=', $id)
                            ->where('entry2_id', '!=', $id);
                    })->count();
                    
                    if ($otherEntryConflicts == 0) {
                        // No other conflicts, reset conflict status
                        $otherEntry->has_conflict = false;
                        $otherEntry->conflict_type = null;
                        $otherEntry->save();
                    }
                }
                
                // Delete the conflict
                $conflict->delete();
            }

            // Delete the timetable entry
            $timetableEntry->delete();

            DB::commit();

            return response()->json(['message' => 'Timetable entry deleted successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error deleting timetable entry: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get all conflicts for this timetable entry.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function conflicts($id)
    {
        $timetableEntry = TimetableEntry::findOrFail($id);
        $conflicts = $timetableEntry->getAllConflicts();
        
        return response()->json($conflicts);
    }

    /**
     * Generate a timetable for the specified academic year and semester.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function generate(Request $request)
    {
        // Check if user is admin
        if (!Auth::user()->isAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            // Clear existing timetable entries for this academic year and semester
            TimetableEntry::where('academic_year', $validated['academic_year'])
                ->where('semester', $validated['semester'])
                ->delete();

            // Clear existing conflicts for this academic year and semester
            Conflict::where('academic_year', $validated['academic_year'])
                ->where('semester', $validated['semester'])
                ->delete();

            // Get all courses, rooms, lecturers, and time slots
            $courses = Course::all();
            $rooms = Room::all();
            $lecturers = Lecturer::with('availability')->get();
            $timeSlots = TimeSlot::all();
            $days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

            // Build array of available slots for each room
            $roomAvailability = [];
            foreach ($rooms as $room) {
                foreach ($days as $day) {
                    foreach ($timeSlots as $timeSlot) {
                        $roomAvailability[$room->id][$day][$timeSlot->id] = true;
                    }
                }
            }

            // Build array of available slots for each lecturer
            $lecturerAvailability = [];
            foreach ($lecturers as $lecturer) {
                foreach ($days as $day) {
                    foreach ($timeSlots as $timeSlot) {
                        $lecturerAvailability[$lecturer->id][$day][$timeSlot->id] = true;
                        
                        // Check against lecturer's defined availability
                        if ($lecturer->availability->isNotEmpty()) {
                            $availableSlot = false;
                            foreach ($lecturer->availability as $availability) {
                                if ($availability->day === $day && $availability->containsTimeSlot($timeSlot)) {
                                    $availableSlot = true;
                                    break;
                                }
                            }
                            $lecturerAvailability[$lecturer->id][$day][$timeSlot->id] = $availableSlot;
                        }
                    }
                }
            }

            // Assign lecturers to courses (simple allocation - in a production system this would be more complex)
            $courseAssignments = [];
            $lecturerCount = $lecturers->count();
            $i = 0;
            
            foreach ($courses as $course) {
                $courseAssignments[$course->id] = $lecturers[$i % $lecturerCount]->id;
                $i++;
            }

            // Schedule courses
            $scheduledEntries = [];
            $conflicts = [];
            
            foreach ($courses as $course) {
                $lecturerId = $courseAssignments[$course->id];
                
                // Find an available slot
                $scheduled = false;
                
                foreach ($days as $day) {
                    if ($scheduled) break;
                    
                    foreach ($timeSlots as $timeSlot) {
                        if ($scheduled) break;
                        
                        // Find a suitable room (based on capacity, type, etc. - simplified here)
                        foreach ($rooms as $room) {
                            // Check if slot is available for both room and lecturer
                            if ($roomAvailability[$room->id][$day][$timeSlot->id] && 
                                $lecturerAvailability[$lecturerId][$day][$timeSlot->id]) {
                                
                                // Create timetable entry
                                $entry = TimetableEntry::create([
                                    'course_id' => $course->id,
                                    'room_id' => $room->id,
                                    'lecturer_id' => $lecturerId,
                                    'day' => $day,
                                    'time_slot_id' => $timeSlot->id,
                                    'has_conflict' => false,
                                    'academic_year' => $validated['academic_year'],
                                    'semester' => $validated['semester'],
                                ]);
                                
                                // Mark slot as used
                                $roomAvailability[$room->id][$day][$timeSlot->id] = false;
                                $lecturerAvailability[$lecturerId][$day][$timeSlot->id] = false;
                                
                                $scheduledEntries[] = $entry;
                                $scheduled = true;
                                break;
                            }
                        }
                    }
                }
                
                // If no slot found, create with conflict
                if (!$scheduled) {
                    // Find a slot where just the lecturer is available
                    $conflictType = null;
                    $conflictingEntry = null;
                    $conflictDay = null;
                    $conflictTimeSlot = null;
                    $conflictRoom = null;
                    
                    foreach ($days as $day) {
                        if ($scheduled) break;
                        
                        foreach ($timeSlots as $timeSlot) {
                            if ($scheduled) break;
                            
                            foreach ($rooms as $room) {
                                if ($lecturerAvailability[$lecturerId][$day][$timeSlot->id]) {
                                    // Lecturer available but room is not
                                    $conflictType = 'ROOM';
                                    $conflictingEntry = TimetableEntry::where('room_id', $room->id)
                                        ->where('day', $day)
                                        ->where('time_slot_id', $timeSlot->id)
                                        ->where('academic_year', $validated['academic_year'])
                                        ->where('semester', $validated['semester'])
                                        ->first();
                                    $conflictDay = $day;
                                    $conflictTimeSlot = $timeSlot;
                                    $conflictRoom = $room;
                                    $scheduled = true;
                                    break;
                                }
                                
                                if ($roomAvailability[$room->id][$day][$timeSlot->id]) {
                                    // Room available but lecturer is not
                                    $conflictType = 'LECTURER';
                                    $conflictingEntry = TimetableEntry::where('lecturer_id', $lecturerId)
                                        ->where('day', $day)
                                        ->where('time_slot_id', $timeSlot->id)
                                        ->where('academic_year', $validated['academic_year'])
                                        ->where('semester', $validated['semester'])
                                        ->first();
                                    $conflictDay = $day;
                                    $conflictTimeSlot = $timeSlot;
                                    $conflictRoom = $room;
                                    $scheduled = true;
                                    break;
                                }
                            }
                        }
                    }
                    
                    if ($scheduled) {
                        // Create entry with conflict
                        $entry = TimetableEntry::create([
                            'course_id' => $course->id,
                            'room_id' => $conflictRoom->id,
                            'lecturer_id' => $lecturerId,
                            'day' => $conflictDay,
                            'time_slot_id' => $conflictTimeSlot->id,
                            'has_conflict' => true,
                            'conflict_type' => $conflictType,
                            'academic_year' => $validated['academic_year'],
                            'semester' => $validated['semester'],
                        ]);
                        
                        // Update conflicting entry
                        if ($conflictingEntry) {
                            $conflictingEntry->has_conflict = true;
                            $conflictingEntry->conflict_type = $conflictType;
                            $conflictingEntry->save();
                            
                            // Create conflict record
                            $description = '';
                            if ($conflictType === 'ROOM') {
                                $description = "Room {$conflictRoom->name} is double-booked.";
                            } else {
                                $description = "Lecturer is scheduled for two classes at the same time.";
                            }
                            
                            $conflict = Conflict::create([
                                'entry1_id' => $entry->id,
                                'entry2_id' => $conflictingEntry->id,
                                'type' => $conflictType,
                                'description' => $description,
                                'resolved' => false,
                                'academic_year' => $validated['academic_year'],
                                'semester' => $validated['semester'],
                            ]);
                            
                            $conflicts[] = $conflict;
                        }
                        
                        $scheduledEntries[] = $entry;
                    } else {
                        // If we can't even create a conflicting entry, just pick a random slot
                        $randomDay = $days[array_rand($days)];
                        $randomTimeSlot = $timeSlots[array_rand($timeSlots->toArray())];
                        $randomRoom = $rooms[array_rand($rooms->toArray())];
                        
                        $entry = TimetableEntry::create([
                            'course_id' => $course->id,
                            'room_id' => $randomRoom->id,
                            'lecturer_id' => $lecturerId,
                            'day' => $randomDay,
                            'time_slot_id' => $randomTimeSlot->id,
                            'has_conflict' => true,
                            'conflict_type' => 'MANUAL_REVIEW',
                            'academic_year' => $validated['academic_year'],
                            'semester' => $validated['semester'],
                        ]);
                        
                        $scheduledEntries[] = $entry;
                    }
                }
            }

            DB::commit();

            // Return generated timetable
            $response = [
                'entries' => $scheduledEntries,
                'conflicts' => $conflicts,
                'stats' => [
                    'total_entries' => count($scheduledEntries),
                    'conflict_count' => count($conflicts),
                ]
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error generating timetable: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Check for conflicts with existing timetable entries.
     *
     * @param  \App\Models\TimetableEntry  $entry
     * @return array
     */
    private function checkForConflicts(TimetableEntry $entry)
    {
        $conflicts = [];
        
        // Get all entries for the same day and time slot
        $potentialConflicts = TimetableEntry::where('id', '!=', $entry->id)
            ->where('day', $entry->day)
            ->where('time_slot_id', $entry->time_slot_id)
            ->where('academic_year', $entry->academic_year)
            ->where('semester', $entry->semester)
            ->get();
        
        foreach ($potentialConflicts as $potentialConflict) {
            // Check for room conflict
            if ($potentialConflict->room_id === $entry->room_id) {
                $conflicts[] = [
                    'entry' => $potentialConflict,
                    'type' => 'ROOM',
                    'description' => "Room {$entry->room->name} is double-booked."
                ];
            }
            
            // Check for lecturer conflict
            if ($potentialConflict->lecturer_id === $entry->lecturer_id) {
                $conflicts[] = [
                    'entry' => $potentialConflict,
                    'type' => 'LECTURER',
                    'description' => "Lecturer {$entry->lecturer->user->full_name} is scheduled for two classes at the same time."
                ];
            }
        }
        
        return $conflicts;
    }
}