<?php

// app/Http/Controllers/CourseController.php
namespace App\Http\Controllers;

use Inertia\Inertia;

class CourseController extends Controller
{
    public function index()
    {
        return Inertia::render('Courses');
    }
}
