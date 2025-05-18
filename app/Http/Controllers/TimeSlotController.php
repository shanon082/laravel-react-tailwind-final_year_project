<?php
namespace App\Http\Controllers;

use App\Models\Settings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TimeSlotController extends Controller
{
    /**
     * Return time slots from settings as JSON.
     */
    public function index()
    {
        try {
            $settings = Settings::where('key', 'time_slots')->first();
            
            if (!$settings) {
                Log::warning('Time slots settings not found');
                return response()->json([]);
            }

            $timeSlots = json_decode($settings->value, true);
            
            if (!is_array($timeSlots)) {
                Log::warning('Invalid time slots format in settings', ['value' => $settings->value]);
                return response()->json([]);
            }

            return response()->json($timeSlots);
        } catch (\Exception $e) {
            Log::error('Error fetching time slots from settings', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([], 500);
        }
    }
}
