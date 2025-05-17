<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class FeedbackNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $feedback;
    protected $type;

    public function __construct($feedback, $type = 'new_feedback')
    {
        $this->feedback = $feedback;
        $this->type = $type;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable)
    {
        $data = [
            'id' => $this->feedback->id,
            'type' => $this->type,
            'title' => $this->feedback->title,
            'content' => $this->feedback->content,
            'url' => '/feedback'
        ];

        if ($this->type === 'new_feedback') {
            $data['message'] = "New feedback received: {$this->feedback->title}";
        } else if ($this->type === 'feedback_response') {
            $data['message'] = "Admin responded to your feedback: {$this->feedback->title}";
            $data['response'] = $this->feedback->resolution_notes;
        }

        return $data;
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
} 