<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\BroadcastMessage;

class TimetableChanged extends Notification implements ShouldQueue
{
    use Queueable;

    protected $changes;

    public function __construct(array $changes)
    {
        $this->changes = $changes;
    }

    public function via($notifiable)
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Timetable Update')
            ->line('Your timetable has been updated.')
            ->line('Changes:')
            ->line($this->changes['description'])
            ->action('View Timetable', url('/timetable'));
    }

    public function toArray($notifiable)
    {
        return [
            'type' => 'timetable_update',
            'changes' => $this->changes,
            'message' => $this->changes['description'],
            'url' => '/timetable'
        ];
    }

    public function toBroadcast($notifiable)
    {
        return new BroadcastMessage([
            'type' => 'timetable_update',
            'changes' => $this->changes,
            'message' => $this->changes['description'],
            'url' => '/timetable'
        ]);
    }
}
