<?php

namespace App\Http\Controllers;

use App\Services\AI\ConflictResolver;
use App\Services\AI\PredictiveAnalytics;
use App\Services\AI\ChatbotService;
use App\Models\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AIController extends Controller
{
    private $conflictResolver;
    private $predictiveAnalytics;
    private $chatbotService;

    public function __construct(
        ConflictResolver $conflictResolver,
        PredictiveAnalytics $predictiveAnalytics,
        ChatbotService $chatbotService
    ) {
        $this->conflictResolver = $conflictResolver;
        $this->predictiveAnalytics = $predictiveAnalytics;
        $this->chatbotService = $chatbotService;
    }

    public function resolveConflict(Request $request)
    {
        try {
            $entry = TimetableEntry::findOrFail($request->entry_id);
            $conflicts = collect($request->conflicts);

            $suggestions = $this->conflictResolver->suggestAlternatives($entry, $conflicts);

            return response()->json([
                'success' => true,
                'suggestions' => $suggestions
            ]);
        } catch (\Exception $e) {
            Log::error('Conflict resolution error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate conflict resolution suggestions'
            ], 500);
        }
    }

    public function getAnalytics()
    {
        try {
            $analytics = $this->predictiveAnalytics->analyzeHistoricalPatterns();

            return response()->json([
                'success' => true,
                'analytics' => $analytics
            ]);
        } catch (\Exception $e) {
            Log::error('Analytics error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate analytics'
            ], 500);
        }
    }

    public function chatQuery(Request $request)
    {
        try {
            $response = $this->chatbotService->processQuery($request->query);

            return response()->json([
                'success' => true,
                'response' => $response
            ]);
        } catch (\Exception $e) {
            Log::error('Chatbot error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to process chat query'
            ], 500);
        }
    }

    public function dashboard()
    {
        try {
            $analytics = $this->predictiveAnalytics->analyzeHistoricalPatterns();
            
            return Inertia::render('AI/Dashboard', [
                'analytics' => $analytics,
                'pageTitle' => 'AI Insights Dashboard'
            ]);
        } catch (\Exception $e) {
            Log::error('AI dashboard error: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to load AI dashboard');
        }
    }
}
