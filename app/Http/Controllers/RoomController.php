<?php

// app/Http/Controllers/RoomController.php
namespace App\Http\Controllers;

use Inertia\Inertia;

class RoomController extends Controller
{
    public function index()
    {
        return Inertia::render('Rooms');
    }
}
