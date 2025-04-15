<?php

use App\Http\Controllers\API\CourseController;
use App\Http\Controllers\API\LecturerController;
use App\Http\Controllers\API\RoomController;
use App\Http\Controllers\API\TimetableController;
use App\Http\Controllers\ProfileController;
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
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/admin/dashboard', function () {
        return Inertia::render('Dashboard/AdminDashboard');
    })->name('admin.dashboard');
});

Route::middleware(['auth', 'role:lecturer'])->group(function () {
    Route::get('/lecturer/dashboard', function () {
        return Inertia::render('Dashboard/LecturerDashboard');
    })->name('lecturer.dashboard');
});

Route::middleware(['auth', 'role:student'])->group(function () {
    Route::get('/student/dashboard', function () {
        return Inertia::render('Dashboard/StudentDashboard');
    })->name('student.dashboard');
});

Route::middleware('auth:sanctum')->group(function () {
    // Course Routes
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);
    Route::get('/courses/{id}/lecturers', [CourseController::class, 'lecturers']);
    Route::get('/courses/{id}/timetable', [CourseController::class, 'timetableEntries']);
    Route::get('/courses/{id}/students', [CourseController::class, 'students']);

    // Lecturer Routes
    Route::get('/lecturers', [LecturerController::class, 'index']);
    Route::post('/lecturers', [LecturerController::class, 'store']);
    Route::get('/lecturers/{id}', [LecturerController::class, 'show']);
    Route::put('/lecturers/{id}', [LecturerController::class, 'update']);
    Route::delete('/lecturers/{id}', [LecturerController::class, 'destroy']);
    Route::get('/lecturers/{id}/courses', [LecturerController::class, 'courses']);
    Route::get('/lecturers/{id}/timetable', [LecturerController::class, 'timetableEntries']);
    Route::get('/lecturers/{id}/availability', [LecturerController::class, 'availability']);

    // Room Routes
    Route::get('/rooms', [RoomController::class, 'index']);
    Route::post('/rooms', [RoomController::class, 'store']);
    Route::get('/rooms/{id}', [RoomController::class, 'show']);
    Route::put('/rooms/{id}', [RoomController::class, 'update']);
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy']);
    Route::get('/rooms/{id}/timetable', [RoomController::class, 'timetableEntries']);
    Route::get('/rooms/{id}/availability', [RoomController::class, 'availability']);

    // Timetable Routes
    Route::get('/timetable', [TimetableController::class, 'index']);
    Route::post('/timetable', [TimetableController::class, 'store']);
    Route::get('/timetable/{id}', [TimetableController::class, 'show']);
    Route::put('/timetable/{id}', [TimetableController::class, 'update']);
    Route::delete('/timetable/{id}', [TimetableController::class, 'destroy']);
    Route::get('/timetable/{id}/conflicts', [TimetableController::class, 'conflicts']);
    Route::post('/timetable/generate', [TimetableController::class, 'generate']);
});

require __DIR__.'/auth.php';
