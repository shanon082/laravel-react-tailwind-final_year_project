<?php
namespace App\Http\Controllers;

use App\Models\TimeSlot;
use Illuminate\Http\Request;

class TimeSlotController extends Controller
{
    /**
     * Return all time slots as JSON.
     */
    public function index()
    {
        return response()->json(TimeSlot::all());
    }
}
