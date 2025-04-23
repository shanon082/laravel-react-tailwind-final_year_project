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
        // Only admins can view feedback
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Fetch feedback with user and course relationships
        $feedbackList = Feedback::with(['user', 'course'])
            ->get()
            ->map(function ($feedback) {
                return [
                    'id' => $feedback->id,
                    'type' => $feedback->type,
                    'title' => $feedback->title,
                    'content' => $feedback->content,
                    'created_at' => $feedback->created_at,
                    'user' => $feedback->user ? ['name' => $feedback->user->name] : null,
                    'course' => $feedback->course ? ['name' => $feedback->course->name] : null,
                    'is_resolved' => $feedback->is_resolved,
                    'resolution_notes' => $feedback->resolution_notes,
                ];
            });

        return Inertia::render('Feedback', [
            'feedbackList' => $feedbackList,
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if (!in_array($user->role, ['lecturer', 'student'])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'type' => 'required|string|in:BUG,FEATURE,IMPROVEMENT,OTHER',
            'message' => 'required|string|min:10|max:500',
            'course_id' => 'nullable|exists:courses,id',
        ]);

        $feedback = Feedback::create([
            'user_id' => Auth::id(),
            'course_id' => $validated['course_id'],
            'type' => $validated['type'],
            'title' => substr($validated['message'], 0, 50),
            'content' => $validated['message'],
            'is_resolved' => false,
        ]);

        return response()->json([
            'message' => 'Feedback submitted successfully!',
            'data' => $feedback
        ], 201);
    }

    public function reply(Request $request, $feedbackId)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'resolution_notes' => 'required|string|min:10|max:1000',
        ]);

        $feedback = Feedback::findOrFail($feedbackId);
        $feedback->update([
            'resolution_notes' => $validated['resolution_notes'],
            'is_resolved' => true,
        ]);

        return response()->json([
            'message' => 'Reply submitted successfully!',
            'data' => $feedback
        ], 200);
    }
}