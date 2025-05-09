<?php

namespace App\Http\Controllers;

use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index(Request $request)
{
    if (!Auth::user()->isAdmin()) {
        Log::warning('Unauthorized settings access attempt', ['user_id' => Auth::id()]);
        if ($request->header('X-Inertia')) {
            return redirect()->route('dashboard')->with('error', 'Unauthorized access');
        }
        return response()->json(['error' => 'Unauthorized access'], 403);
    }

    try {
        $settings = Settings::all()->mapWithKeys(function ($item) {
            return [$item->key => json_decode($item->value, true)];
        })->toArray();
        if ($request->header('X-Inertia')) {
            return Inertia::render('Settings', [
                'settings' => $settings,
                'auth' => auth()->user(),
                'message' => 'Settings retrieved successfully',
            ]);
        }

        return response()->json([
            'settings' => $settings,
            'message' => 'Settings retrieved successfully',
        ], 200);
    } catch (\Exception $e) {
        Log::error('Error retrieving settings', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        if ($request->header('X-Inertia')) {
            return redirect()->route('dashboard')->with('error', 'Error retrieving settings');
        }
        return response()->json(['error' => 'Error retrieving settings'], 500);
    }
}
    // public function get(Request $request)
    // {
    //     if (!Auth::user()->isAdmin()) {
    //         Log::warning('Unauthorized settings access attempt', ['user_id' => Auth::id()]);
    //         return response()->json(['error' => 'Unauthorized access'], 403);
    //     }

    //     try {
    //         $settings = Settings::all()->pluck('value', 'key')->toArray();
    //         return response()->json([
    //             'settings' => $settings,
    //             'message' => 'Settings retrieved successfully',
    //         ], 200);
    //     } catch (\Exception $e) {
    //         Log::error('Error retrieving settings', [
    //             'error' => $e->getMessage(),
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return response()->json(['error' => 'Error retrieving settings'], 500);
    //     }
    // }

    public function update(Request $request)
{
    if (!Auth::user()->isAdmin()) {
        Log::warning('Unauthorized settings update attempt', ['user_id' => Auth::id()]);
        if ($request->header('X-Inertia')) {
            return redirect()->route('settings')->with('error', 'Unauthorized access');
        }
        return response()->json(['error' => 'Unauthorized access'], 403);
    }

    try {
        $validated = $request->validate([
            'academic_year' => 'required|string|max:255',
            'semesters' => 'required|array',
            'semesters.*.name' => 'required|in:First,Second,Third',
            'semesters.*.start_date' => 'required|date',
            'semesters.*.end_date' => 'required|date|after:semesters.*.start_date',
            'time_slots' => 'required|array',
            'time_slots.*.start_time' => 'required|date_format:H:i:s',
            'time_slots.*.end_time' => 'required|date_format:H:i:s|after:time_slots.*.start_time',
            'lunch_break' => 'required|array',
            'lunch_break.start_time' => 'required|date_format:H:i:s',
            'lunch_break.end_time' => 'required|date_format:H:i:s|after:lunch_break.start_time',
            'max_courses_per_day' => 'required|integer|min:1|max:10',
            'notifications' => 'required|array',
            'notifications.email' => 'required|boolean',
            'notifications.in_app' => 'required|boolean',
            'export_format' => 'required|in:csv,pdf',
            'theme' => 'required|array',
            'theme.primary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'theme.secondary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        DB::beginTransaction();
        try {
            $settings = [
                'academic_year' => $validated['academic_year'],
                'semesters' => $validated['semesters'],
                'time_slots' => $validated['time_slots'],
                'lunch_break' => $validated['lunch_break'],
                'max_courses_per_day' => $validated['max_courses_per_day'],
                'notifications' => $validated['notifications'],
                'export_format' => $validated['export_format'],
                'theme' => $validated['theme'],
            ];

            foreach ($settings as $key => $value) {
                Settings::updateOrCreate(
                    ['key' => $key],
                    ['value' => json_encode($value)]
                );
            }

            DB::commit();
            if ($request->header('X-Inertia')) {
                return redirect()->route('settings')->with('success', 'Settings updated successfully');
            }

            return response()->json([
                'settings' => $settings,
                'message' => 'Settings updated successfully',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error saving settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            if ($request->header('X-Inertia')) {
                return redirect()->route('settings')->with('error', 'Error saving settings');
            }
            return response()->json(['error' => 'Error saving settings'], 500);
        }
    } catch (\Exception $e) {
        Log::error('Error validating settings', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        if ($request->header('X-Inertia')) {
            return redirect()->route('settings')->with('error', 'Invalid input data');
        }
        return response()->json(['error' => 'Invalid input data'], 422);
    }
}
}