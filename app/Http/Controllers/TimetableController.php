<?php

// app/Http/Controllers/TimetableController.php
namespace App\Http\Controllers;

use Inertia\Inertia;

class TimetableController extends Controller
{
    public function index()
    {
        return Inertia::render('Timetable');
    }
}
