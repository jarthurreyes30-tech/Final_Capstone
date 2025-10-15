<?php

namespace App\Http\Controllers;

use App\Models\{FundUsageLog, Campaign, Charity};
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class FundUsageController extends Controller
{
    // public view of a campaign's spending
    public function publicIndex(Campaign $campaign){
        return $campaign->charity->fundUsageLogs()
            ->where('campaign_id',$campaign->id)
            ->latest('spent_at')->paginate(20);
    }

    // charity admin adds an expense
    public function store(Request $r, Campaign $campaign){
        try {
            $charity = $campaign->charity;
            abort_unless($charity->owner_id === $r->user()->id, 403, 'You can only add fund usage logs to your own charity campaigns');

            $data = $r->validate([
                'amount' => 'required|numeric|min:0',
                'category' => 'required|in:supplies,staffing,transport,operations,other',
                'description' => 'nullable|string|max:1000',
                'spent_at' => 'nullable|date|before_or_equal:today',
                'attachment' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:5120'
            ]);

            $attachmentPath = null;
            if ($r->hasFile('attachment')) {
                $attachmentPath = $r->file('attachment')->store('fund_usage_attachments', 'public');
            }

            $fundUsageLog = FundUsageLog::create([
                'charity_id' => $charity->id,
                'campaign_id' => $campaign->id,
                'amount' => $data['amount'],
                'category' => $data['category'],
                'description' => $data['description'] ?? null,
                'spent_at' => $data['spent_at'] ?? now(),
                'attachment_path' => $attachmentPath
            ]);

            return response()->json([
                'message' => 'Fund usage log created successfully',
                'fund_usage_log' => $fundUsageLog->load(['charity', 'campaign'])
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            Log::error('Fund usage log creation failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'campaign_id' => $campaign->id,
                'charity_id' => $charity->id ?? null,
                'user_id' => $r->user()->id
            ]);

            return response()->json([
                'message' => 'Failed to create fund usage log',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
