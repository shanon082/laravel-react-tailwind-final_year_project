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
    try {
        Log::info('Settings update attempt', [
            'user_id' => Auth::id(),
            'is_admin' => Auth::user()->isAdmin(),
            'request_data' => $request->all()
        ]);

        if (!Auth::user()->isAdmin()) {
            Log::warning('Unauthorized settings update attempt', ['user_id' => Auth::id()]);
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

            Log::info('Settings validation passed', ['validated_data' => $validated]);

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
                    Log::info("Attempting to save setting: {$key}", ['value' => $value]);
                    
                    try {
                        $result = Settings::updateOrCreate(
                            ['key' => $key],
                            ['value' => json_encode($value)]
                        );
                        
                        Log::info("Setting saved successfully: {$key}", [
                            'result' => $result->toArray(),
                            'value' => $value
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Error saving setting: {$key}", [
                            'error' => $e->getMessage(),
                            'value' => $value
                        ]);
                        throw $e;
                    }
                }

                DB::commit();
                Log::info('All settings saved successfully', ['settings' => $settings]);

                if ($request->wantsJson()) {
                    return response()->json([
                        'settings' => $settings,
                        'message' => 'Settings updated successfully',
                    ], 200);
                }

                return redirect()->route('settings')->with('success', 'Settings updated successfully');
            } catch (\Exception $e) {
                DB::rollBack();
                Log::error('Error saving settings', [
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
                
                if ($request->wantsJson()) {
                    return response()->json(['error' => 'Error saving settings: ' . $e->getMessage()], 500);
                }
                
                return redirect()->route('settings')->with('error', 'Error saving settings');
            }
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error', [
                'errors' => $e->errors(),
                'request_data' => $request->all()
            ]);
            
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Validation failed', 'details' => $e->errors()], 422);
            }
            
            return redirect()->route('settings')->withErrors($e->errors());
        }
    } catch (\Exception $e) {
        Log::error('Unexpected error in settings update', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
        
        if ($request->wantsJson()) {
            return response()->json(['error' => 'Unexpected error: ' . $e->getMessage()], 500);
        }
        
        return redirect()->route('settings')->with('error', 'An unexpected error occurred');
    }
}
}