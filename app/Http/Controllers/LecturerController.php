<?php

// app/Http/Controllers/LecturerController.php
namespace App\Http\Controllers;

use Inertia\Inertia;

class LecturerController extends Controller
{
    public function index()
    {
        return Inertia::render('Lecturers');
    }
}