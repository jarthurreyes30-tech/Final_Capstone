<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Campaign extends Model
{
    protected $fillable = [
        'charity_id',
        'title',
        'description',
        'problem',
        'solution',
        'expected_outcome',
        'target_amount',
        'deadline_at',
        'cover_image_path',
        'status',
        'donation_type',
        'start_date',
        'end_date',
        'donation_channel_id',
    ];

    protected $casts = [
        'deadline_at' => 'datetime',
        'target_amount' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
    ];

    protected $appends = ['current_amount'];

    // Relationships
    public function charity()
    {
        return $this->belongsTo(Charity::class);
    }

    public function donations()
    {
        return $this->hasMany(Donation::class);
    }

    public function donationChannel()
    {
        return $this->belongsTo(DonationChannel::class);
    }

    // Accessors
    public function getCurrentAmountAttribute()
    {
        return $this->donations()
            ->where('status', 'completed')
            ->sum('amount');
    }

    public function fundUsageLogs()
    {
        return $this->hasMany(FundUsageLog::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function comments()
    {
        return $this->hasMany(CampaignComment::class);
    }

    public function approvedComments()
    {
        return $this->hasMany(CampaignComment::class)->where('status', 'approved');
    }

    public function volunteers()
    {
        return $this->hasMany(Volunteer::class);
    }
}
