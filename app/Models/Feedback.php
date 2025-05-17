<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Feedback extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'type',
        'title',
        'content',
        'is_resolved',
        'resolution_notes',
    ];

    protected $casts = [
        'is_resolved' => 'boolean',
    ];

    /**
     * Get the user that submitted the feedback.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the course associated with the feedback, if any.
     */
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Scope a query to only include feedback with a specific status.
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope a query to only include feedback of a specific type.
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include feedback with minimum rating.
     */
    public function scopeWithMinRating($query, $rating)
    {
        return $query->where('rating', '>=', $rating);
    }
}