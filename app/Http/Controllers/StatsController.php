<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Department;
use App\Models\Lecturer;
use App\Models\Room;

class StatsController extends Controller
{
    public function totalCourses()
    {
        return response()->json(['totalCourses' => Course::count()]);
    }

    public function totalLecturers()
    {
        return response()->json(['totalLecturers' => Lecturer::count()]);
    }

    public function availableRooms()
    {
        // Assuming rooms have an 'is_available' column or similar logic
        return response()->json(['availableRooms' => Room::count()]);
    }

    public function totalDepartments()
    {
        return response()->json(['totalDepartments' => Department::count()]);
    }
}