<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

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
        return ['database']; // Store in notifications table
    }

    public function toArray($notifiable)
    {
        return [
            'message' => "Course '{$this->course->name}' has been updated.",
            'link' => "/courses/{$this->course->id}",
            'course_id' => $this->course->id,
        ];
    }
}