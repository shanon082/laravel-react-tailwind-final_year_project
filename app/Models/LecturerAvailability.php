<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LecturerAvailability extends Model
{
    use HasFactory;

    protected $table = 'lecturer_availability';

    protected $fillable = [
        'lecturer_id',
        'day',
        'start_time',
        'end_time',
    ];
    public static function rules()
{
    return [
        'lecturer_id' => 'required|exists:lecturers,id',
        'day' => 'required|string|in:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY',
        'start_time' => 'required|date_format:H:i',
        'end_time' => 'required|date_format:H:i|after:start_time',
    ];
}

    protected $casts = [
        'start_time' => 'datetime:H:i',
        'end_time' => 'datetime:H:i',
    ];

    /**
     * Get the lecturer that owns the availability record.
     */
    public function lecturer()
    {
        return $this->belongsTo(Lecturer::class);
    }

    /**
     * Check if a given time slot fits within this availability block.
     *
     * @param \App\Models\TimeSlot $timeSlot
     * @return bool
     */
    public function containsTimeSlot(TimeSlot $timeSlot)
    {
        $availabilityStart = strtotime($this->start_time);
        $availabilityEnd = strtotime($this->end_time);
        $slotStart = strtotime($timeSlot->start_time);
        $slotEnd = strtotime($timeSlot->end_time);

        return $availabilityStart <= $slotStart && $availabilityEnd >= $slotEnd;
    }
}