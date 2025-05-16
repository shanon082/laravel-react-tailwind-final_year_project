<?php

namespace App\Http\Controllers;
use App\Services\TimetableGeneratorService;
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
            return response()->json(['error' => 'Unauthorized access'], 403);
        }

        try {
            // Validate input
            $validated = $request->validate([
                'academic_year' => [
                    'required',
                    'string',
                    'regex:/^\d{4}\/\d{4}$/',
                    function ($attribute, $value, $fail) {
                        $years = explode('/', $value);
                        if (count($years) !== 2 || 
                            !is_numeric($years[0]) || 
                            !is_numeric($years[1]) || 
                            (int)$years[1] !== (int)$years[0] + 1) {
                            $fail('The academic year must be consecutive years (e.g., 2023/2024).');
                        }
                    },
                ],
                'semester' => 'required|integer|in:1,2',
            ]);

            // Log generation attempt
            Log::info('Starting timetable generation', [
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester'],
                'user_id' => Auth::id()
            ]);

            // Fetch and validate required data
            $courses = Course::where('semester', $validated['semester'])
                          ->with(['enrollments', 'prerequisites'])
                          ->get();
            
            if ($courses->isEmpty()) {
                return response()->json([
                    'error' => 'No courses found for the specified semester'
                ], 404);
            }

            $rooms = Room::all();
            if ($rooms->isEmpty()) {
                return response()->json([
                    'error' => 'No rooms available for timetable generation'
                ], 404);
            }

            $lecturers = Lecturer::with(['user', 'availability'])->get();
            if ($lecturers->isEmpty()) {
                return response()->json([
                    'error' => 'No lecturers available for timetable generation'
                ], 404);
            }

            $timeSlots = TimeSlot::orderBy('start_time')->get();
            if ($timeSlots->isEmpty()) {
                return response()->json([
                    'error' => 'No time slots defined for timetable generation'
                ], 404);
            }

            // Begin transaction
            DB::beginTransaction();

            try {
                // Clear existing entries for this academic year and semester
                TimetableEntry::where('academic_year', $validated['academic_year'])
                    ->where('semester', $validated['semester'])
                    ->delete();

                // Initialize the generator service
                $generator = new TimetableGeneratorService();
                
                // Generate the timetable
                $result = $generator->generate(
                    $validated['academic_year'],
                    $validated['semester'],
                    $courses,
                    $rooms,
                    $lecturers,
                    $timeSlots
                );

                if (!$result) {
                    throw new \Exception('Failed to generate timetable');
                }

                DB::commit();

                // Return success response with statistics
                return response()->json([
                    'message' => 'Timetable generated successfully',
                    'stats' => [
                        'courses_scheduled' => $courses->count(),
                        'rooms_used' => $rooms->count(),
                        'lecturers_assigned' => $lecturers->count(),
                        'time_slots_available' => $timeSlots->count()
                    ]
                ]);

            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Failed to generate timetable', [
                    'error' => $e->getMessage(),
                    'academic_year' => $validated['academic_year'],
                    'semester' => $validated['semester']
                ]);
                
                return response()->json([
                    'error' => 'Failed to generate timetable: ' . $e->getMessage()
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Validation or data preparation failed', [
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Failed to prepare data for timetable generation: ' . $e->getMessage()
            ], 400);
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