<?php

use App\Http\Controllers\API\CourseController as APICourseController;
use App\Http\Controllers\API\LecturerController as APILecturerController;
use App\Http\Controllers\API\RoomController as APIRoomController;
use App\Http\Controllers\API\TimetableController as APITimetableController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TimetableController;
use App\Models\Room;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('verified')->name('dashboard');
    Route::get('/courses', [CourseController::class, 'index'])->name('courses');
    Route::get('/lecturers', [LecturerController::class, 'index'])->name('lecturers');
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/timetable', [TimetableController::class, 'index'])->name('timetable');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');

    Route::middleware('role:admin')->get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::middleware('role:lecturer')->get('/lecturer/dashboard', [DashboardController::class, 'index'])->name('lecturer.dashboard');
    Route::middleware('role:student')->get('/student/dashboard', [DashboardController::class, 'index'])->name('student.dashboard');
});

// API Routes
// Route::middleware('auth:sanctum')->group(function () {
//     Route::apiResource('courses', APICourseController::class);
//     Route::get('/courses/{id}/lecturers', [APICourseController::class, 'lecturers']);
//     Route::get('/courses/{id}/timetable', [APICourseController::class, 'timetableEntries']);
//     Route::get('/courses/{id}/students', [APICourseController::class, 'students']);

//     Route::apiResource('lecturers', APILecturerController::class);
//     Route::get('/lecturers/{id}/courses', [APILecturerController::class, 'courses']);
//     Route::get('/lecturers/{id}/timetable', [APILecturerController::class, 'timetableEntries']);
//     Route::get('/lecturers/{id}/availability', [APILecturerController::class, 'availability']);

//     Route::apiResource('rooms', APIRoomController::class);
//     Route::get('/rooms/{id}/timetable', [APIRoomController::class, 'timetableEntries']);
//     Route::get('/rooms/{id}/availability', [APIRoomController::class, 'availability']);

//     Route::apiResource('timetable', APITimetableController::class);
//     Route::get('/timetable/{id}/conflicts', [APITimetableController::class, 'conflicts']);
//     Route::post('/timetable/generate', [APITimetableController::class, 'generate']);
// });

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::get('/rooms/{id}', [RoomController::class, 'show']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::put('/rooms/{id}', [RoomController::class, 'update']);
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
});

Route::middleware('auth')->group(function () {
    Route::get('/rooms', function () {
        $query = Room::query();

        if (request()->has('search') && request()->search) {
            $query->where('name', 'like', '%' . request()->search . '%');
        }
        if (request()->has('type') && request()->type) {
            $query->where('type', request()->type);
        }
        if (request()->has('building') && request()->building) {
            $query->where('building', request()->building);
        }

        $perPage = request()->input('per_page', 10);
        $rooms = $query->select('id', 'name', 'type', 'building', 'capacity')
                       ->paginate($perPage);

        $buildings = Room::distinct('building')->pluck('building');

        return inertia('Rooms', [
            'auth' => [
                'user' => auth()->user() ? [
                    'id' => auth()->user()->id,
                    'name' => auth()->user()->name,
                    'role' => auth()->user()->role,
                ] : null,
            ],
            'roomsResponse' => [
                'data' => $rooms->items(),
                'current_page' => $rooms->currentPage(),
                'last_page' => $rooms->lastPage(),
                'total' => $rooms->total(),
                'buildings' => $buildings,
            ],
            'filters' => [
                'search' => request()->search ?? '',
                'type' => request()->type ?? '',
                'building' => request()->building ?? '',
            ],
        ]);
    })->name('rooms');

    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::put('/rooms/{id}', [RoomController::class, 'update'])->name('rooms.update');
});

// Remove or comment out the auth:sanctum group for /rooms to avoid conflict
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/rooms/{id}', [RoomController::class, 'show']); // Keep for API if needed
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
});

require __DIR__.'/auth.php';
