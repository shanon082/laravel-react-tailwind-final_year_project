<?php

use App\Http\Controllers\FacultyController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\LecturerController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RoomController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\TestDepart;
use App\Http\Controllers\TimetableController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\TimeSlotController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('welcome');

Route::middleware('auth')->group(function () {
    // Stats Routes
    Route::get('/total-courses', [StatsController::class, 'totalCourses']);
    Route::get('/total-lecturers', [StatsController::class, 'totalLecturers']);
    Route::get('/available-rooms', [StatsController::class, 'availableRooms']);
    Route::get('/total-departments', [StatsController::class, 'totalDepartments']);

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Main Pages
    Route::get('/dashboard', [DashboardController::class, 'index'])->middleware('verified')->name('dashboard');
    Route::get('/courses', [CourseController::class, 'index'])->name('courses');
    Route::get('/lecturers', [LecturerController::class, 'index'])->name('lecturers');
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/timetable', [TimetableController::class, 'index'])->name('timetable');
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::get('/feedback', [FeedbackController::class, 'index'])->name('feedback');
    //Route::get('/departments', [DepartmentController::class, 'index'])->name('departments');
    Route::get('/faculties', [FacultyController::class, 'index'])->name('faculties');
    Route::get('/timeslots', [TimeSlotController::class, 'index']);

    // Faculty API Routes
    Route::get('/faculties', [FacultyController::class, 'index'])->name('faculties');
    Route::get('/faculties/{id}', [FacultyController::class, 'show'])->name('faculties.show');
    Route::post('/faculties', [FacultyController::class, 'store'])->name('faculties.store');
    Route::put('/faculties/{id}', [FacultyController::class, 'update'])->name('faculties.update');
    Route::delete('/faculties/{id}', [FacultyController::class, 'destroy'])->name('faculties.destroy');
    Route::get('/faculties/{id}/departments', [FacultyController::class, 'departments'])->name('faculties.departments');
    Route::get('/faculties/{id}/lecturers', [FacultyController::class, 'lecturers'])->name('faculties.lecturers');
    Route::get('/faculties/{id}/courses', [FacultyController::class, 'courses'])->name('faculties.courses');
    Route::get('/faculties/{id}/students', [FacultyController::class, 'students'])->name('faculties.students');

    // Department API Routes
    Route::get('/department', [TestDepart::class, 'index'])->name('departments');
    Route::get('/department/{id}', [TestDepart::class, 'show'])->name('departments.show');
    Route::post('/department', [TestDepart::class, 'store'])->name('departments.store');
    Route::put('/department/{id}', [TestDepart::class, 'update'])->name('departments.update');
    Route::delete('/department/{id}', [TestDepart::class, 'destroy'])->name('departments.destroy');
    Route::get('/department/{id}/lecturers', [TestDepart::class, 'lecturers'])->name('departments.lecturers');
    Route::get('/department/{id}/courses', [TestDepart::class, 'courses'])->name('departments.courses');
    Route::get('/department/{id}/students', [TestDepart::class, 'students'])->name('departments.students');

    // Role-Based Dashboards
    Route::middleware('role:admin')->get('/admin/dashboard', [DashboardController::class, 'index'])->name('admin.dashboard');
    Route::middleware('role:lecturer')->get('/lecturer/dashboard', [DashboardController::class, 'index'])->name('lecturer.dashboard');
    Route::middleware('role:student')->get('/student/dashboard', [DashboardController::class, 'index'])->name('student.dashboard');

    // Feedback Routes
    Route::get('/feedback', [FeedbackController::class, 'index'])->name('feedback');
    Route::post('/feedback', [FeedbackController::class, 'store'])->name('feedback.store');
    Route::post('/feedback/{feedbackId}/reply', [FeedbackController::class, 'reply'])->name('feedback.reply');

    // Room Routes
    Route::get('/rooms', [RoomController::class, 'index'])->name('rooms');
    Route::get('/rooms/{id}', [RoomController::class, 'show'])->name('rooms.show');
    Route::post('/rooms', [RoomController::class, 'store'])->name('rooms.store');
    Route::put('/rooms/{id}', [RoomController::class, 'update'])->name('rooms.update');
    Route::delete('/rooms/{id}', [RoomController::class, 'destroy'])->name('rooms.destroy');
    Route::get('/rooms/{id}/timetable', [RoomController::class, 'rooms.timetableEntries']);
    Route::get('/rooms/{id}/availability', [RoomController::class, 'rooms.availability']);

    // Course Routes
    Route::get('/courses', [CourseController::class, 'index'])->name('courses');
    Route::get('/courses/{id}', [CourseController::class, 'show'])->name('courses.show');
    Route::post('/courses', [CourseController::class, 'store'])->name('courses.store');
    Route::put('/courses/{id}', [CourseController::class, 'update'])->name('courses.update');
    Route::delete('/courses/{id}', [CourseController::class, 'destroy'])->name('courses.destroy');
    Route::get('/courses/{id}/lecturers', [CourseController::class, 'courses.lecturers']);
    Route::get('/courses/{id}/timetable', [CourseController::class, 'courses.timetableEntries']);
    Route::get('/courses/{id}/students', [CourseController::class, 'courses.students']);
    Route::get('/departments', [CourseController::class, 'departmentsList'])->name('departments.list');
    Route::get('/lecturers/list', [CourseController::class, 'lecturersList'])->name('lecturers.list');

    // Lecturer Routes
    Route::get('/lecturers', [LecturerController::class, 'index'])->name('lecturers');
    Route::get('/lecturers/{id}', [LecturerController::class, 'show'])->name('lecturers.show');
    Route::post('/lecturers', [LecturerController::class, 'store'])->name('lecturers.store');
    Route::put('/lecturers/{id}', [LecturerController::class, 'update'])->name('lecturers.update');
    Route::delete('/lecturers/{id}', [LecturerController::class, 'destroy'])->name('lecturers.destroy');
    Route::get('/lecturers/{id}/courses', [LecturerController::class, 'lecturers.courses']);
    Route::get('/lecturers/{id}/timetable', [LecturerController::class, 'lecturers.timetableEntries']);
    Route::get('/lecturers/{id}/availability', [LecturerController::class, 'availability'])->name('lecturers.availability');
    Route::post('/lecturers/{lecturerId}/availability', [LecturerController::class, 'storeAvailability'])->name('lecturers.availability.store');
    Route::delete('/lecturers/availability/{id}', [LecturerController::class, 'destroyAvailability'])->name('lecturers.availability.destroy');

    // Timetable Routes
    Route::get('/timetable', [TimetableController::class, 'index']);
    Route::post('/timetable', [TimetableController::class, 'timetables.store']);
    Route::get('/timetable/{id}', [TimetableController::class, 'timetables.show']);
    Route::put('/timetable/{id}', [TimetableController::class, 'timetables.update']);
    Route::delete('/timetable/{id}', [TimetableController::class, 'timetables.destroy']);
    Route::get('/timetable/{id}/conflicts', [TimetableController::class, 'timetables.conflicts']);
    Route::post('/timetable/generate', [TimetableController::class, 'generate']);
    Route::get('timetable/export', [TimetableController::class, 'export'])->name('timetable.export');
    Route::get('/timetable/{id}/timetable', [TimetableController::class, 'timetables.timetableEntries']);
    Route::get('/timetable/{id}/availability', [TimetableController::class, 'timetables.availability']);

    // Notification Routes
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead'])->name('notifications.read-all');

    // Settings Routes
    Route::get('/settings', [SettingsController::class, 'index'])->name('settings');
    Route::post('/settings', [SettingsController::class, 'update'])->name('settings.update');
});

require __DIR__ . '/auth.php';
