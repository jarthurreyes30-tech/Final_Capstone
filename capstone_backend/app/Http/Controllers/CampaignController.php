<?php

namespace App\Http\Controllers;

use App\Models\{Campaign, Charity};
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class CampaignController extends Controller
{
    public function index(Request $r, Charity $charity){
        // If authenticated user owns the charity, show all campaigns
        if ($r->user() && $charity->owner_id === $r->user()->id) {
            return $charity->campaigns()->latest()->paginate(12);
        }
        // Otherwise only show published campaigns
        return $charity->campaigns()->where('status','published')->latest()->paginate(12);
    }

    public function show(Campaign $campaign){
        return $campaign->load('charity');
    }

    public function store(Request $r, Charity $charity){
        try {
            abort_unless($charity->owner_id === $r->user()->id, 403, 'You can only create campaigns for your own charity');

            $data = $r->validate([
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'problem' => 'nullable|string',
                'solution' => 'nullable|string',
                'expected_outcome' => 'nullable|string',
                'target_amount' => 'nullable|numeric|min:0',
                'deadline_at' => 'nullable|date|after:today',
                'status' => 'in:draft,published,closed,archived',
                'donation_type' => 'required|in:one_time,recurring',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            // Handle cover image upload
            if ($r->hasFile('cover_image')) {
                $data['cover_image_path'] = $r->file('cover_image')->store('campaign_covers', 'public');
            }

            // Set default status if not provided
            if (!isset($data['status'])) {
                $data['status'] = 'draft';
            }

            // Build payload of only known, safe keys
            $payload = [
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'problem' => $data['problem'] ?? null,
                'solution' => $data['solution'] ?? null,
                'expected_outcome' => $data['expected_outcome'] ?? null,
                'target_amount' => $data['target_amount'] ?? 0,
                'deadline_at' => $data['deadline_at'] ?? null,
                'status' => $data['status'],
                'donation_type' => $data['donation_type'],
                'start_date' => $data['start_date'] ?? null,
                'end_date' => $data['end_date'] ?? null,
            ];
            if (!empty($data['cover_image_path'])) {
                $payload['cover_image_path'] = $data['cover_image_path'];
            }

            // Filter payload keys to those that exist in the campaigns table
            foreach (array_keys($payload) as $key) {
                if (!Schema::hasColumn('campaigns', $key)) {
                    unset($payload[$key]);
                }
            }

            $campaign = $charity->campaigns()->create($payload);

            return response()->json([
                'message' => 'Campaign created successfully',
                'campaign' => $campaign->load('charity')
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Campaign creation failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'charity_id' => $charity->id,
                'user_id' => $r->user()->id
            ]);

            return response()->json([
                'message' => 'Failed to create campaign',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $r, Campaign $campaign){
        abort_unless($campaign->charity->owner_id === $r->user()->id, 403);
        
        $data = $r->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'problem' => 'nullable|string',
            'solution' => 'nullable|string',
            'expected_outcome' => 'nullable|string',
            'target_amount' => 'nullable|numeric|min:0',
            'deadline_at' => 'nullable|date',
            'status' => 'sometimes|in:draft,published,closed,archived',
            'donation_type' => 'sometimes|in:one_time,recurring',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'donation_channel_id' => 'nullable|exists:donation_channels,id',
            'cover_image' => 'nullable|image|mimes:jpeg,png,jpg|max:2048'
        ]);

        // Handle cover image upload
        if ($r->hasFile('cover_image')) {
            $data['cover_image_path'] = $r->file('cover_image')->store('campaign_covers', 'public');
        }

        $campaign->update($data);
        return $campaign->load('charity');
    }

    public function destroy(Request $r, Campaign $campaign){
        abort_unless($campaign->charity->owner_id === $r->user()->id, 403);
        $campaign->delete();
        return response()->noContent();
    }

    /**
     * Get campaign updates/posts
     */
    public function getUpdates(Campaign $campaign)
    {
        // TODO: Implement updates/posts relationship
        // For now, return empty array
        return response()->json(['data' => []]);
    }

    /**
     * Get campaign supporters (donors with their total contributions)
     */
    public function getSupporters(Campaign $campaign)
    {
        $supporters = $campaign->donations()
            ->with('donor:id,name,email')
            ->where('status', 'completed')
            ->selectRaw('donor_id, is_anonymous, SUM(amount) as total_amount, MAX(donated_at) as donated_at, MAX(created_at) as created_at')
            ->groupBy('donor_id', 'is_anonymous')
            ->orderByRaw('SUM(amount) DESC')
            ->get()
            ->map(function ($donation) {
                return [
                    'id' => $donation->donor_id,
                    'donor_id' => $donation->donor_id,
                    'name' => $donation->is_anonymous ? 'Anonymous' : $donation->donor?->name,
                    'donor' => $donation->is_anonymous ? null : [
                        'id' => $donation->donor?->id,
                        'name' => $donation->donor?->name,
                    ],
                    'is_anonymous' => $donation->is_anonymous,
                    'amount' => $donation->total_amount,
                    'total_amount' => $donation->total_amount,
                    'donated_at' => $donation->donated_at,
                    'created_at' => $donation->created_at,
                ];
            });

        return response()->json(['data' => $supporters]);
    }

    /**
     * Get campaign donations with pagination
     */
    public function getDonations(Request $request, Campaign $campaign)
    {
        $donations = $campaign->donations()
            ->with('donor:id,name,email')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 10));

        return response()->json($donations);
    }

    /**
     * Get campaign fund usage breakdown
     */
    public function getFundUsage(Campaign $campaign)
    {
        // TODO: Implement fund usage tracking
        // For now, return empty array
        return response()->json(['data' => []]);
    }

    /**
     * Get campaign statistics
     */
    public function getStats(Campaign $campaign)
    {
        $stats = [
            'total_raised' => $campaign->current_amount ?? 0,
            'target_amount' => $campaign->target_amount ?? 0,
            'donors_count' => $campaign->donations()->where('status', 'completed')->distinct('donor_id')->count(),
            'donations_count' => $campaign->donations()->where('status', 'completed')->count(),
            'pending_donations' => $campaign->donations()->where('status', 'pending')->count(),
            'progress_percentage' => $campaign->target_amount > 0 
                ? round(($campaign->current_amount / $campaign->target_amount) * 100, 2) 
                : 0,
        ];

        return response()->json($stats);
    }
}
