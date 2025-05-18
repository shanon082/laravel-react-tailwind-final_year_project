<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Room;
use App\Models\Lecturer;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Services\TimetableGeneratorService;
use App\Services\TimetableValidator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Conflict;
use App\Models\Notification;
use App\Models\LecturerAvailability;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Response;
use League\Csv\Writer;
use PDF;
use Excel;
use App\Exports\TimetableExport;

class TimetableController extends Controller
{
    protected $timetableService;
    protected $validator;

    public function __construct(TimetableGeneratorService $timetableService, TimetableValidator $validator)
    {
        $this->timetableService = $timetableService;
        $this->validator = $validator;
    }

    public function index(Request $request)
    {
        try {
            $query = TimetableEntry::with(['course', 'lecturer', 'room', 'timeSlot']);
    
            // Apply filters if provided
        if ($request->has('academic_year')) {
            $query->where('academic_year', $request->academic_year);
        }
        if ($request->has('semester')) {
            $query->where('semester', $request->semester);
        }
    
            $timetable = $query->get();

            // Get any conflicts
            $conflicts = collect($timetable)->map(function ($entry) {
                return $this->validator->validateEntry($entry);
            })->filter()->values();

            return Inertia::render('Timetable', [
                'timetable' => $timetable,
                'conflicts' => $conflicts,
                'filters' => [
                    'academic_year' => $request->academic_year,
                    'semester' => $request->semester
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching timetable:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Timetable', [
                'timetable' => [],
                'conflicts' => [],
                'error' => 'Failed to load timetable: ' . $e->getMessage()
            ]);
        }
    }

    public function show($id)
    {
        try {
            $timetable = TimetableEntry::with([
                'course',
                'lecturer',
                'room',
                'timeSlot'
            ])->findOrFail($id);

            return Inertia::render('Timetable/Show', [
                'timetable' => $timetable
            ]);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Timetable not found');
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'academic_year' => 'required|string',
                'semester' => 'required|integer|between:1,3',
                'entries' => 'required|array'
            ]);

            $entries = collect($validated['entries'])->map(function ($entry) {
                return TimetableEntry::create($entry);
            });

            return response()->json([
                'message' => 'Timetable created successfully',
                'entries' => $entries
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to create timetable: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $entry = TimetableEntry::findOrFail($id);
            $entry->update($request->all());

            return response()->json([
                'message' => 'Timetable entry updated successfully',
                'entry' => $entry
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update timetable entry: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $entry = TimetableEntry::findOrFail($id);
            $entry->delete();

            return response()->json([
                'message' => 'Timetable entry deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to delete timetable entry: ' . $e->getMessage()
            ], 500);
    }
}

    public function generate(Request $request)
    {
        try {
            $validated = $request->validate([
                'academic_year' => 'required|string',
                'semester' => 'required|integer|between:1,3'
            ]);

            // Get required data for timetable generation
            $courses = Course::all();
            $rooms = Room::all();
            $lecturers = Lecturer::all();
            $timeSlots = TimeSlot::all();

            $result = $this->timetableService->generate(
                    $validated['academic_year'],
                    $validated['semester'],
                    $courses,
                    $rooms,
                    $lecturers,
                    $timeSlots
                );

                if (!$result) {
                return back()->with('error', 'Failed to generate timetable. Please try again.');
            }

            // Get the generated timetable entries with relationships
            $timetable = TimetableEntry::with(['course', 'lecturer', 'room', 'timeSlot'])
                ->where('academic_year', $validated['academic_year'])
                ->where('semester', $validated['semester'])
                ->get();

            // Get any conflicts
            $conflicts = collect($timetable)->map(function ($entry) {
                return $this->validator->validateEntry($entry);
            })->filter()->values();

            // Return the response with Inertia
            return Inertia::render('Timetable', [
                'timetable' => $timetable,
                'conflicts' => $conflicts,
                'filters' => [
                    'academic_year' => $validated['academic_year'],
                    'semester' => $validated['semester']
                ],
                'stats' => [
                    'total_entries' => $timetable->count(),
                    'total_conflicts' => $conflicts->count()
                ]
                ]);

        } catch (\Exception $e) {
            Log::error('Timetable generation failed: ' . $e->getMessage());
            return back()->with('error', 'An error occurred while generating the timetable: ' . $e->getMessage());
        }
    }

    public function conflicts($id)
    {
        try {
            $timetable = TimetableEntry::findOrFail($id);
            $conflicts = $this->validator->validateEntry($timetable);

            return response()->json([
                'conflicts' => $conflicts
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to check conflicts: ' . $e->getMessage()
            ], 500);
        }
    }

    public function timetableEntries($id)
    {
        try {
            $entries = TimetableEntry::where('timetable_id', $id)
                ->with(['course', 'lecturer', 'room', 'timeSlot'])
        ->get();

            return response()->json([
                'entries' => $entries
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch timetable entries: ' . $e->getMessage()
            ], 500);
        }
    }

    public function availability($id)
    {
        try {
            $timetable = TimetableEntry::findOrFail($id);
            $availability = [
                'lecturer' => $timetable->lecturer->availability,
                'room' => $timetable->room->availability
            ];

            return response()->json($availability);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch availability: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        try {
            $validated = $request->validate([
                'academic_year' => 'required|string',
                'semester' => 'required|integer|between:1,3',
                'format' => 'required|in:pdf,excel'
            ]);

            $entries = TimetableEntry::where([
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester']
            ])->with(['course', 'lecturer', 'room', 'timeSlot'])->get();

            if ($validated['format'] === 'pdf') {
                // Generate PDF
                $pdf = PDF::loadView('exports.timetable', ['entries' => $entries]);
                return $pdf->download('timetable.pdf');
            } else {
                // Generate Excel
                return Excel::download(new TimetableExport($entries), 'timetable.xlsx');
            }
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to export timetable: ' . $e->getMessage());
        }
}
}