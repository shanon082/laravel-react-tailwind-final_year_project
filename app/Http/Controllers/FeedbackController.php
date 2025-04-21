<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class FeedbackController extends Controller
{
    public function index()
    {
        return Inertia::render('Feedback');
    }

    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string',
            'message' => 'required|string|min:10',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        $feedback = Feedback::create([
            'user_id' => Auth::id(),
            'course_id' => $request->course_id,
            'type' => strtoupper($request->type),
            'title' => substr($request->message, 0, 50),
            'content' => $request->message,
        ]);

        return response()->json([
            'message' => 'Feedback submitted successfully!',
            'data' => $feedback
        ], 201);
    }
}