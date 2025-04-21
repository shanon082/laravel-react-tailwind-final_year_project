<?php

use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\TimetableController;
use App\Models\Conflict;
use App\Models\Course;
use App\Models\Lecturer;
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

    Route::get('/stats', function() {
        return response()->json([
            'totalCourses' => Course::count(),
            'totalLecturers' => Lecturer::count(),
            'availableRooms' => Room::where('is_available', true)->count(),
            'totalConflicts' => Conflict::count(),
        ]);
    });

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('verified')->name('dashboard');
    Route::get('/courses', [CourseController::class, 'index'])->name('courses');
    Route::get('/lecturers', [LecturerController::class, 'index'])->name('lecturers');
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/timetable', [TimetableController::class, 'index'])->name('timetable');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::get('/feedback', [FeedbackController::class, 'index'])->name('feedback');

    Route::middleware('role:admin')->get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::middleware('role:lecturer')->get('/lecturer/dashboard', [DashboardController::class, 'index'])->name('lecturer.dashboard');
    Route::middleware('role:student')->get('/student/dashboard', [DashboardController::class, 'index'])->name('student.dashboard');
});

Route::middleware('auth')->group(function () {
    Route::post('/feedback',[FeedbackController::class, 'store'])->name('feedback.store');
});



Route::middleware('auth')->group(function () {
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/rooms/{id}', [RoomController::class, 'show'])->name('rooms.show');
    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::put('/rooms/{id}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::get('/rooms/{id}/timetable', [RoomController::class, 'rooms.timetableEntries']);
    Route::get('/rooms/{id}/availability', [RoomController::class, 'rooms.availability']);


});
Route::middleware('auth')->group(function () {
    Route::get('/courses', [CourseController::class, 'index'])->name('courses');
    Route::get('/courses/{id}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::put('/courses/{id}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('/courses/{id}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::get('/courses/{id}/lecturers', [CourseController::class, 'courses.lecturers']);
    Route::get('/courses/{id}/timetable', [CourseController::class, 'courses.timetableEntries']);
    Route::get('/courses/{id}/students', [CourseController::class, 'courses.students']);
});

Route::middleware('auth')->group(function () {
    Route::get('/lecturers', [LecturerController::class, 'index'])->name('lecturers');
    Route::get('/lecturers/{id}', [LecturerController::class, 'show'])->name('lecturers.show');
    Route::post('/lecturers', [LecturerController::class, 'store'])->name('lecturers.store');
    Route::put('/lecturers/{id}', [LecturerController::class, 'update'])->name('lecturers.update');
    Route::delete('/lecturers/{id}', [LecturerController::class, 'destroy'])->name('lecturers.destroy');
    Route::get('/lecturers/{id}/courses', [LecturerController::class, 'lecturers.courses']);
    Route::get('/lecturers/{id}/timetable', [LecturerController::class, 'lecturers.timetableEntries']);
    Route::get('/lecturers/{id}/availability', [LecturerController::class, 'lecturers.availability']);
    Route::post('/lecturers/{lecturerId}/availability', [LecturerController::class, 'storeAvailability'])->name('lecturers.availability.store');
    Route::delete('/lecturers/availability/{id}', [LecturerController::class, 'destroyAvailability'])->name('lecturers.availability.destroy');
});

Route::middleware('auth')->group(function(){
    Route::get('/timetable', [TimetableController::class, 'index']);
    Route::post('/timetable', [TimetableController::class, 'timetables.store']);
    Route::get('/timetable/{id}', [TimetableController::class, 'timetables.show']);
    Route::put('/timetable/{id}', [TimetableController::class, 'timetables.update']);
    Route::delete('/timetable/{id}', [TimetableController::class, 'timetables.destroy']);
    Route::get('/timetable/{id}/conflicts', [TimetableController::class, 'timetables.conflicts']);
    Route::post('/timetable/generate', [TimetableController::class, 'timetables.generate']);
});

require __DIR__.'/auth.php';
