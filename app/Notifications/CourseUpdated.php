<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;
use Illuminate\Notifications\Messages\BroadcastMessage;

class CourseUpdated extends Notification
{
    use Queueable;

    protected $course;

    public function __construct($course)
    {
        $this->course = $course;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => "Course '{$this->course->name}' has been updated.",
            'link' => "/courses/{$this->course->id}",
            'course_id' => $this->course->id,
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'id' => $this->id,
            'type' => $this->type,
            'data' => $this->toDatabase($notifiable),
            'created_at' => now()->toDateTimeString(),
            'read_at' => null,
        ]);
    }
}