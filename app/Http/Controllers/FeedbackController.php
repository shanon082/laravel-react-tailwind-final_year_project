<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\User;
use App\Notifications\FeedbackNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;
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
        try {
            $user = $request->user();
            if (!in_array($user->role, ['lecturer', 'student'])) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'type' => 'required|string|in:BUG,FEATURE,IMPROVEMENT,OTHER',
                'message' => 'required|string|min:10|max:500',
                'course_id' => 'nullable|exists:courses,id',
            ]);

            // Create a title from the first 50 characters of the message
            $title = substr($validated['message'], 0, 50);
            if (strlen($validated['message']) > 50) {
                $title .= '...';
            }

            $feedback = Feedback::create([
                'user_id' => Auth::id(),
                'course_id' => $validated['course_id'],
                'type' => $validated['type'],
                'title' => $title,
                'content' => $validated['message'],
                'is_resolved' => false,
            ]);

            // Notify all admins about the new feedback
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new FeedbackNotification($feedback, 'new_feedback'));

            return response()->json([
                'message' => 'Feedback submitted successfully!',
                'data' => $feedback
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Feedback creation error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Could not submit feedback. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function reply(Request $request, $feedbackId)
    {
        try {
            if (Auth::user()->role !== 'admin') {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $validated = $request->validate([
                'resolution_notes' => 'required|string|min:10|max:1000',
            ]);

            $feedback = Feedback::with('user')->findOrFail($feedbackId);
            
            if ($feedback->is_resolved) {
                return response()->json([
                    'message' => 'This feedback has already been resolved.'
                ], 422);
            }

            $feedback->update([
                'resolution_notes' => $validated['resolution_notes'],
                'is_resolved' => true,
            ]);

            // Notify the feedback author about the response
            if ($feedback->user) {
                $feedback->user->notify(new FeedbackNotification($feedback, 'feedback_response'));
            }

            // Send email notification to the user
            if ($feedback->user && $feedback->user->email) {
                try {
                    Mail::send('emails.feedback-response', [
                        'userName' => $feedback->user->name,
                        'feedbackContent' => $feedback->content,
                        'responseContent' => $validated['resolution_notes'],
                    ], function($message) use ($feedback) {
                        $message->to($feedback->user->email)
                            ->subject('Response to Your Feedback - Timetable System');
                    });
                } catch (\Exception $e) {
                    \Log::error('Failed to send feedback response email: ' . $e->getMessage());
                    // Continue execution even if email fails
                }
            }

            return response()->json([
                'message' => 'Reply submitted successfully!',
                'data' => $feedback
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Feedback reply error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Could not submit reply. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}