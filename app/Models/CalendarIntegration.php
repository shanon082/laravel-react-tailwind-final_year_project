<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CalendarIntegration extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'provider',
        'calendar_id',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'last_sync_at',
        'sync_enabled',
    ];

    protected $casts = [
        'token_expires_at' => 'datetime',
        'last_sync_at' => 'datetime',
        'sync_enabled' => 'boolean',
    ];

    protected $hidden = [
        'access_token',
        'refresh_token',
    ];

    /**
     * Get the user that owns the calendar integration.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if the access token is expired.
     *
     * @return bool
     */
    public function isTokenExpired()
    {
        return now()->greaterThan($this->token_expires_at);
    }

    /**
     * Check if sync is due based on last sync time.
     *
     * @param int $hourThreshold Hours since last sync to consider sync due
     * @return bool
     */
    public function isSyncDue($hourThreshold = 6)
    {
        if (!$this->last_sync_at) {
            return true;
        }

        return now()->diffInHours($this->last_sync_at) >= $hourThreshold;
    }
}