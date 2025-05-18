<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Lecturer;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => 'required|in:admin,lecturer,student',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Create lecturer record if user is registering as a lecturer
        if ($request->role === 'lecturer') {
            \Log::info('Creating lecturer record for user', ['user_id' => $user->id]);
            
            $lecturer = Lecturer::create([
                'user_id' => $user->id,
                'username' => strtolower(str_replace(' ', '.', $request->name)),
                'fullName' => $request->name,
                'email' => $request->email,
                'department' => 'Pending Assignment', // This can be updated later
                'contact' => 'Pending',
                'title' => 'Lecturer', // Default title
            ]);

            \Log::info('Created lecturer record', ['lecturer_id' => $lecturer->id]);
        }

        event(new Registered($user));

        Auth::login($user);

        return match($user->role) {
            'admin' => redirect(route('admin.dashboard')),
            'lecturer' => redirect(route('lecturer.dashboard')),
            'student' => redirect(route('student.dashboard')),
            default => redirect(route('dashboard')),
        };
    }
}
