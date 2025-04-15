<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'start_time',
        'end_time',
    ];

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    /**
     * Get the timetable entries for this time slot.
     */
    public function timetableEntries()
    {
        return $this->hasMany(TimetableEntry::class);
    }

    /**
     * Get a formatted representation of the time slot.
     *
     * @return string
     */
    public function getFormattedTimeAttribute()
    {
        return date('h:i A', strtotime($this->start_time)) . ' - ' . date('h:i A', strtotime($this->end_time));
    }

    /**
     * Get the duration of the time slot in minutes.
     *
     * @return int
     */
    public function getDurationAttribute()
    {
        $start = strtotime($this->start_time);
        $end = strtotime($this->end_time);
        
        return ($end - $start) / 60;
    }

    /**
     * Check if this time slot overlaps with another time slot.
     *
     * @param \App\Models\TimeSlot $otherSlot
     * @return bool
     */
    public function overlaps(TimeSlot $otherSlot)
    {
        $thisStart = strtotime($this->start_time);
        $thisEnd = strtotime($this->end_time);
        $otherStart = strtotime($otherSlot->start_time);
        $otherEnd = strtotime($otherSlot->end_time);

        return (
            ($thisStart < $otherEnd && $thisEnd > $otherStart) ||
            ($otherStart < $thisEnd && $otherEnd > $thisStart)
        );
    }
}