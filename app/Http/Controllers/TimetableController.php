<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TimetableEntry;
use App\Models\Conflict;
use App\Models\Notification;
use App\Models\Course;
use App\Models\Lecturer;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\LecturerAvailability;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use League\Csv\Writer;

class TimetableController extends Controller
{
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
    
        if ($request->has('department')) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('department', $request->department);
            });
        }
    
        if ($request->has('level')) {
            $query->whereHas('course', function ($q) use ($request) {
                $q->where('level', $request->level);
            });
        }
    
        $entries = $query->get();
    
        if ($request->header('X-Inertia')) {
            return Inertia::render('Timetable', [
                'timetable' => $entries->map(function ($entry) {
                    return [
                        'id' => $entry->id,
                        'course' => [
                            'id' => $entry->course->id,
                            'name' => $entry->course->name,
                            'code' => $entry->course->code,
                            'department' => $entry->course->department,
                            'level' => $entry->course->year_level,
                            'color_code' => $entry->course->color_code,
                        ],
                        'lecturer' => $entry->lecturer,
                        'room' => $entry->room,
                        'time_slot' => $entry->timeSlot,
                        'day' => $entry->day,
                        'academic_year' => $entry->academic_year,
                        'semester' => $entry->semester,
                        'has_conflict' => $entry->has_conflict,
                        'conflict_type' => $entry->conflict_type,
                    ];
                }),
                'auth' => auth()->user(),
                'filters' => [
                    'academic_year' => $request->academic_year ?? '',
                    'semester' => $request->semester ?? '',
                    'course_id' => $request->course_id ?? '',
                    'lecturer_id' => $request->lecturer_id ?? '',
                    'room_id' => $request->room_id ?? '',
                    'day' => $request->day ?? '',
                    'department' => $request->department ?? '',
                    'level' => $request->level ?? '',
                ],
                'flash' => [
                    'error' => $request->session()->get('error'),
                    'success' => $request->session()->get('success'),
                ],
            ]);
        }
    
        return response()->json($entries);
    }

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

    public function show($id)
    {
        $timetableEntry = TimetableEntry::with(['course', 'lecturer.user', 'room', 'timeSlot'])->findOrFail($id);
        return response()->json($timetableEntry);
    }

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

    public function conflicts($id)
    {
        $timetableEntry = TimetableEntry::findOrFail($id);
        $conflicts = $timetableEntry->getAllConflicts();
        
        return response()->json($conflicts);
    }

    // In TimetableController.php
public function save(Request $request)
{
    if (!Auth::user()->isAdmin()) {
        return response()->json(['error' => 'Unauthorized access'], 403);
    }

    $validated = $request->validate([
        'timetable' => 'required|array',
        'timetable.*.course_id' => 'required|exists:courses,id',
        'timetable.*.lecturer_id' => 'required|exists:lecturers,id',
        'timetable.*.room_id' => 'required|exists:rooms,id',
        'timetable.*.time_slot_id' => 'required|exists:time_slots,id',
        'timetable.*.day' => 'required|in:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
        'timetable.*.academic_year' => 'required|string',
        'timetable.*.semester' => 'required|in:First,Second,Third',
    ]);

    DB::beginTransaction();
    try {
        TimetableEntry::where('academic_year', $validated['timetable'][0]['academic_year'])
            ->where('semester', $validated['timetable'][0]['semester'])
            ->delete();

        foreach ($validated['timetable'] as $entry) {
            TimetableEntry::create($entry);
        }

        DB::commit();
        return response()->json(['message' => 'Timetable saved successfully'], 200);
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Failed to save timetable', ['error' => $e->getMessage()]);
        return response()->json(['error' => 'Failed to save timetable'], 500);
    }
}
public function generate(Request $request)
{
    if (!Auth::user()->isAdmin()) {
        Log::warning('Unauthorized timetable generation attempt', ['user_id' => Auth::id()]);
        return response()->json(['error' => 'Unauthorized access'], 403);
    }

    try {
        Log::info('Starting timetable generation', ['request' => $request->all()]);

        // Validate input
        $validated = $request->validate([
            'academic_year' => 'required|string|max:255',
            'semester' => 'required|in:First,Second,Third',
        ]);

        $academicYear = $validated['academic_year'];
        $semester = $validated['semester'];

        // Fetch settings
        $settings = Setting::all()->pluck('value', 'key')->toArray();
        $timeSlotsData = isset($settings['time_slots']) ? json_decode($settings['time_slots'], true) : [];
        $lunchBreak = isset($settings['lunch_break']) ? json_decode($settings['lunch_break'], true) : null;
        $maxCoursesPerDay = isset($settings['max_courses_per_day']) ? json_decode($settings['max_courses_per_day'], true) : 4;

        // Fetch data
        $courses = Course::where('semester', $semester)->get();
        $rooms = Room::all();
        $lecturers = Lecturer::all();
        $timeSlots = TimeSlot::all();
        $availabilities = LecturerAvailability::all();

        Log::info('Data counts', [
            'courses' => $courses->count(),
            'rooms' => $rooms->count(),
            'lecturers' => $lecturers->count(),
            'time_slots' => $timeSlots->count(),
            'availabilities' => $availabilities->count(),
        ]);

        // Validate data existence
        if ($courses->isEmpty()) {
            Log::warning('No courses found for semester: ' . $semester);
            return response()->json(['error' => 'No courses available for the selected semester'], 400);
        }
        if ($rooms->isEmpty() || $lecturers->isEmpty() || $timeSlots->isEmpty()) {
            Log::warning('Missing required data: rooms, lecturers, or time slots');
            return response()->json(['error' => 'Missing required data (rooms, lecturers, or time slots)'], 400);
        }

        // Build OpenAI prompt
        $prompt = "Generate a university timetable for academic year $academicYear, semester $semester. Ensure no conflicts in room or lecturer scheduling and respect lecturer availability. Return the timetable as a JSON array of objects with fields: course_id, lecturer_id, room_id, time_slot_id, day, academic_year, semester.\n\n";
        $prompt .= "Courses (ID, Code, Name, Enrolled Students):\n" . $courses->map(function ($course) {
            return "[{$course->id}, {$course->code}, {$course->name}, {$course->enrollments()->count()}]";
        })->implode("\n") . "\n\n";
        $prompt .= "Rooms (ID, Name, Capacity):\n" . $rooms->map(function ($room) {
            return "[{$room->id}, {$room->name}, {$room->capacity}]";
        })->implode("\n") . "\n\n";
        $prompt .= "Lecturers (ID, Name):\n" . $lecturers->map(function ($lecturer) {
            return "[{$lecturer->id}, {$lecturer->userDetails->fullName}]";
        })->implode("\n") . "\n\n";
        $prompt .= "Time Slots (ID, Start, End):\n" . $timeSlotsData->map(function ($slot, $index) {
            return "[{$index}, {$slot['start_time']}, {$slot['end_time']}]";
        })->implode("\n") . "\n\n";
        $prompt .= "Availabilities (Lecturer ID, Day, Start, End):\n" . $availabilities->map(function ($avail) {
            return "[{$avail->lecturer_id}, {$avail->day}, {$avail->start_time}, {$avail->end_time}]";
        })->implode("\n") . "\n\n";
        $prompt .= "Constraints:\n";
        $prompt .= "- Ensure rooms have sufficient capacity for the number of students enrolled in each course.\n";
        $prompt .= "- Respect lecturer availability strictly (only schedule within their available times).\n";
        $prompt .= "- Avoid scheduling the same lecturer or room for multiple courses at the same time on the same day.\n";
        $prompt .= "- Limit each lecturer to a maximum of $maxCoursesPerDay courses per day.\n";
        $prompt .= "- Valid days are: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY.\n";
        $prompt .= "Output format: ```json\n[]\n```";

        // Call OpenAI API
        $openaiApiKey = env('OPENAI_API_KEY');
        if (!$openaiApiKey) {
            Log::error('OPENAI_API_KEY is not set in .env');
            return response()->json(['error' => 'OpenAI API key is not configured'], 500);
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $openaiApiKey,
            'Content-Type' => 'application/json',
        ])->timeout(30)->post('https://api.openai.com/v1/chat/completions', [
            'model' => 'gpt-3.5-turbo',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a timetable scheduling assistant. Generate a conflict-free timetable in JSON format.'],
                ['role' => 'user', 'content' => $prompt],
            ],
            'max_tokens' => 4000,
            'temperature' => 0.5,
        ]);

        if ($response->failed()) {
            Log::error('OpenAI API call failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return response()->json(['error' => 'Failed to generate timetable with OpenAI'], 500);
        }

        // Parse OpenAI response
        $aiResponse = $response->json();
        $content = $aiResponse['choices'][0]['message']['content'] ?? '';
        Log::info('OpenAI response content', ['content' => $content]);

        preg_match('/```json\n([\s\S]*?)\n```/', $content, $matches);
        if (empty($matches[1])) {
            try {
                $timetableData = json_decode($content, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($timetableData)) {
                    Log::info('Parsed JSON directly from content');
                } else {
                    throw new \Exception('Invalid JSON format');
                }
            } catch (\Exception $e) {
                Log::error('Failed to parse JSON from OpenAI response', [
                    'content' => $content,
                    'error' => $e->getMessage(),
                ]);
                return response()->json(['error' => 'Invalid OpenAI response format'], 500);
            }
        } else {
            $timetableData = json_decode($matches[1], true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON decoding failed', [
                    'error' => json_last_error_msg(),
                    'data' => $matches[1],
                ]);
                return response()->json(['error' => 'Invalid JSON in OpenAI response'], 500);
            }
        }

        if (!is_array($timetableData)) {
            Log::error('Timetable data is not an array', ['data' => $timetableData]);
            return response()->json(['error' => 'Invalid timetable data format'], 500);
        }

        // Enrich timetable data with related information
        $enrichedTimetable = array_map(function ($entry) use ($courses, $rooms, $lecturers, $timeSlotsData) {
            $course = $courses->firstWhere('id', $entry['course_id']);
            $room = $rooms->firstWhere('id', $entry['room_id']);
            $lecturer = $lecturers->firstWhere('id', $entry['lecturer_id']);
            $timeSlotIndex = $entry['time_slot_id'];
            $timeSlot = isset($timeSlotsData[$timeSlotIndex]) ? $timeSlotsData[$timeSlotIndex] : null;

            return [
                'id' => uniqid(),
                'course' => $course ? [
                    'id' => $course->id,
                    'name' => $course->name,
                    'code' => $course->code,
                    'color_code' => $course->color_code,
                    'department' => $course->department,
                    'level' => $course->year_level,
                ] : null,
                'room' => $room ? [
                    'id' => $room->id,
                    'name' => $room->name,
                ] : null,
                'lecturer' => $lecturer ? [
                    'id' => $lecturer->id,
                    'userDetails' => [
                        'fullName' => $lecturer->userDetails->fullName,
                    ],
                ] : null,
                'timeSlot' => $timeSlot ? [
                    'id' => $timeSlotIndex,
                    'startTime' => $timeSlot['start_time'],
                    'endTime' => $timeSlot['end_time'],
                ] : null,
                'day' => $entry['day'],
                'academic_year' => $entry['academic_year'],
                'semester' => $entry['semester'],
                'hasConflict' => false,
                'conflictType' => null,
            ];
        }, $timetableData);

        // Validate and check for conflicts
        $conflicts = $this->checkForConflicts($enrichedTimetable, $courses, $rooms, $lecturers, $timeSlots, $availabilities, $maxCoursesPerDay);

        // Update entries with conflict information
        $enrichedTimetable = array_map(function ($entry, $index) use ($conflicts) {
            $conflict = collect($conflicts)->firstWhere('index', $index);
            if ($conflict) {
                $entry['hasConflict'] = true;
                $entry['conflictType'] = $conflict['type'];
            }
            return $entry;
        }, $enrichedTimetable, array_keys($enrichedTimetable));

        // Save to timetable_entries
        DB::beginTransaction();
        try {
            TimetableEntry::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->delete();

            foreach ($timetableData as $entry) {
                TimetableEntry::create([
                    'course_id' => $entry['course_id'],
                    'lecturer_id' => $entry['lecturer_id'],
                    'room_id' => $entry['room_id'],
                    'time_slot_id' => $entry['time_slot_id'],
                    'day' => $entry['day'],
                    'academic_year' => $entry['academic_year'],
                    'semester' => $entry['semester'],
                ]);
            }

            DB::commit();
            Log::info('Timetable saved to timetable_entries', [
                'academic_year' => $academicYear,
                'semester' => $semester,
                'entries' => count($timetableData),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to save timetable', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Failed to save timetable'], 500);
        }

        // Create notification
        Notification::create([
            'user_id' => Auth::id(),
            'title' => 'Timetable Generated',
            'message' => count($conflicts) > 0
                ? 'Timetable generated with ' . count($conflicts) . ' conflicts. Please review.'
                : 'Timetable generated and saved successfully for ' . $academicYear . ', ' . $semester . '.',
            'type' => count($conflicts) > 0 ? 'warning' : 'success',
        ]);

        // Return JSON response
        return response()->json([
            'timetable' => $enrichedTimetable,
            'conflicts' => $conflicts,
            'message' => count($conflicts) > 0
                ? 'Timetable generated with conflicts'
                : 'Timetable generated and saved successfully',
        ], 200);

    } catch (\Exception $e) {
        Log::error('Error in timetable generation', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        return response()->json(['error' => 'Error generating timetable: ' . $e->getMessage()], 500);
    }
}

public function export(Request $request)
{
    if (!Auth::user()->isAdmin()) {
        Log::warning('Unauthorized timetable export attempt', ['user_id' => Auth::id()]);
        return response()->json(['error' => 'Unauthorized access'], 403);
    }

    $validated = $request->validate([
        'academic_year' => 'required|string|max:255',
        'semester' => 'required|in:First,Second,Third',
        'format' => 'required|in:csv,pdf',
    ]);

    $academicYear = $validated['academic_year'];
    $semester = $validated['semester'];
    $format = $validated['format'];

    // Fetch timetable entries
    $entries = TimetableEntry::with(['course', 'room', 'lecturer', 'timeSlot'])
        ->where('academic_year', $academicYear)
        ->where('semester', $semester)
        ->get();

    if ($entries->isEmpty()) {
        return response()->json(['error' => 'No timetable entries found for export'], 404);
    }

    if ($format === 'csv') {
        $csv = Writer::createFromString();
        $csv->insertOne([
            'Course Code',
            'Course Name',
            'Day',
            'Time',
            'Room',
            'Lecturer',
            'Academic Year',
            'Semester',
        ]);

        foreach ($entries as $entry) {
            $csv->insertOne([
                $entry->course->code,
                $entry->course->name,
                $entry->day,
                "{$entry->timeSlot->start_time} - {$entry->timeSlot->end_time}",
                $entry->room->name,
                $entry->lecturer->userDetails->fullName,
                $entry->academic_year,
                $entry->semester,
            ]);
        }

        $filename = "timetable_{$academicYear}_{$semester}.csv";
        return Response::make($csv->toString(), 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    } else {
        $latexContent = "\\documentclass{article}\n";
        $latexContent .= "\\usepackage{booktabs}\n";
        $latexContent .= "\\usepackage{geometry}\n";
        $latexContent .= "\\geometry{a4paper, margin=1in}\n";
        $latexContent .= "\\title{Timetable for {$academicYear} - {$semester}}\n";
        $latexContent .= "\\author{}\n";
        $latexContent .= "\\date{}\n";
        $latexContent .= "\\begin{document}\n";
        $latexContent .= "\\maketitle\n";
        $latexContent .= "\\section*{Timetable}\n";
        $latexContent .= "\\begin{tabular}{lllp{4cm}ll}\n";
        $latexContent .= "\\toprule\n";
        $latexContent .= "Course Code & Course Name & Day & Time & Room & Lecturer \\\\\n";
        $latexContent .= "\\midrule\n";

        foreach ($entries as $entry) {
            $courseCode = addslashes($entry->course->code);
            $courseName = addslashes($entry->course->name);
            $day = addslashes($entry->day);
            $time = addslashes("{$entry->timeSlot->start_time} - {$entry->timeSlot->end_time}");
            $room = addslashes($entry->room->name);
            $lecturer = addslashes($entry->lecturer->userDetails->fullName);
            $latexContent .= "$courseCode & $courseName & $day & $time & $room & $lecturer \\\\\n";
        }

        $latexContent .= "\\bottomrule\n";
        $latexContent .= "\\end{tabular}\n";
        $latexContent .= "\\end{document}\n";

        $filename = "timetable_{$academicYear}_{$semester}.tex";
        return Response::make($latexContent, 200, [
            'Content-Type' => 'text/latex',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ]);
    }
}

private function checkForConflicts($timetableData, $courses, $rooms, $lecturers, $timeSlots, $availabilities, $maxCoursesPerDay)
{
    $conflicts = [];
    $scheduled = [];
    $lecturerDailyCount = [];

    foreach ($timetableData as $index => $entry) {
        if (!$entry['course'] || !$entry['room'] || !$entry['lecturer'] || !$entry['timeSlot']) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'INVALID_ENTRY',
                'description' => 'Missing or invalid course, room, lecturer, or time slot',
            ];
            continue;
        }

        $course = $courses->firstWhere('id', $entry['course']['id']);
        $room = $rooms->firstWhere('id', $entry['room']['id']);
        $lecturer = $lecturers->firstWhere('id', $entry['lecturer']['id']);
        $timeSlot = $timeSlots->firstWhere('id', $entry['timeSlot']['id']);

        // Check room capacity
        if ($room->capacity < $course->enrollments()->count()) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'CAPACITY',
                'description' => "Room {$room->name} capacity ({$room->capacity}) is insufficient for course {$course->name} (enrolled: {$course->enrollments()->count()})",
            ];
        }

        // Check lecturer availability
        $availability = $availabilities->where('lecturer_id', $entry['lecturer']['id'])
            ->where('day', $entry['day'])
            ->where('start_time', '<=', $entry['timeSlot']['startTime'])
            ->where('end_time', '>=', $entry['timeSlot']['endTime'])
            ->first();

        if (!$availability) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'AVAILABILITY',
                'description' => "Lecturer {$lecturer->userDetails->fullName} is not available on {$entry['day']} at {$entry['timeSlot']['startTime']}",
            ];
        }

        // Check max courses per day
        $lecturerDayKey = "{$entry['lecturer']['id']}_{$entry['day']}";
        if (!isset($lecturerDailyCount[$lecturerDayKey])) {
            $lecturerDailyCount[$lecturerDayKey] = 0;
        }
        $lecturerDailyCount[$lecturerDayKey]++;
        if ($lecturerDailyCount[$lecturerDayKey] > $maxCoursesPerDay) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'MAX_COURSES',
                'description' => "Lecturer {$lecturer->userDetails->fullName} exceeds max courses per day ($maxCoursesPerDay) on {$entry['day']}",
            ];
        }

        // Check for room and lecturer conflicts
        $key = "{$entry['day']}_{$entry['timeSlot']['id']}";
        if (!isset($scheduled[$key])) {
            $scheduled[$key] = [];
        }

        if (in_array($entry['room']['id'], $scheduled[$key])) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'ROOM_CONFLICT',
                'description' => "Room {$room->name} is already scheduled on {$entry['day']} at {$entry['timeSlot']['startTime']}",
            ];
        }
        if (in_array($entry['lecturer']['id'], $scheduled[$key])) {
            $conflicts[] = [
                'index' => $index,
                'type' => 'LECTURER_CONFLICT',
                'description' => "Lecturer {$lecturer->userDetails->fullName} is already scheduled on {$entry['day']} at {$entry['timeSlot']['startTime']}",
            ];
        }

        $scheduled[$key][] = $entry['room']['id'];
        $scheduled[$key][] = $entry['lecturer']['id'];
    }

    return $conflicts;
}
    
}