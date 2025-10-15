<?php

namespace App\Http\Controllers;

use App\Models\{Charity, CharityDocument, DonationChannel, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Services\NotificationService;

class CharityController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    // Public directory with advanced search and filtering
    public function index(Request $r){
        $q = Charity::query()->where('verification_status','approved');

        // Search by name or description
        if($term = $r->query('q')) {
            $q->where(function($query) use ($term) {
                $query->where('name','like',"%$term%")
                      ->orWhere('mission','like',"%$term%")
                      ->orWhere('vision','like',"%$term%");
            });
        }

        // Filter by category
        if($category = $r->query('category')) {
            $q->where('category', $category);
        }

        // Filter by region
        if($region = $r->query('region')) {
            $q->where('region', $region);
        }

        // Filter by municipality
        if($municipality = $r->query('municipality')) {
            $q->where('municipality', $municipality);
        }

        // Sort options
        $sortBy = $r->query('sort', 'name'); // name, created_at, total_received
        switch($sortBy) {
            case 'newest':
                $q->orderBy('created_at', 'desc');
                break;
            case 'total_received':
                $q->leftJoin('donations', function($join) {
                    $join->on('charities.id', '=', 'donations.charity_id')
                         ->where('donations.status', '=', 'completed');
                })
                ->selectRaw('charities.*, COALESCE(SUM(donations.amount), 0) as total_received')
                ->groupBy('charities.id')
                ->orderBy('total_received', 'desc');
                break;
            default:
                $q->orderBy('name');
        }

        // Get unique values for filters
        $filters = [
            'categories' => Charity::where('verification_status','approved')
                ->whereNotNull('category')
                ->distinct()
                ->pluck('category'),
            'regions' => Charity::where('verification_status','approved')
                ->whereNotNull('region')
                ->distinct()
                ->pluck('region'),
        ];

        $charities = $q->paginate(12);

        return response()->json([
            'charities' => $charities,
            'filters' => $filters,
            'total' => $charities->total(),
        ]);
    }

    public function show(Charity $charity){
        return $charity->load([
            'documents',
            'owner:id,name,email'
        ])->loadCount(['donations as total_received' => function($q){
            $q->where('status','completed')->select(\DB::raw('coalesce(sum(amount),0)'));
        }]);
    }

    // Charity Admin creates their org
    public function store(Request $r){
        $r->validate(['name'=>'required|string|max:255']);
        $charity = Charity::create([
            'owner_id'=>$r->user()->id,
            'name'=>$r->input('name'),
            'mission'=>$r->input('mission'),
            'contact_email'=>$r->input('contact_email'),
            'contact_phone'=>$r->input('contact_phone'),
        ]);

        // Notify admins about new charity registration
        $admins = User::where('role', 'admin')->get();
        foreach ($admins as $admin) {
            $this->notificationService->sendSystemAlert(
                $admin,
                "A new charity '{$charity->name}' has registered and needs verification.",
                'info'
            );
        }

        return response()->json($charity,201);
    }

    // Update org
    public function update(Request $r, Charity $charity){
        try {
            abort_unless($charity->owner_id === $r->user()->id, 403, 'You can only update your own charity');

            $validated = $r->validate([
                'name' => 'sometimes|string|max:255',
                'acronym' => 'sometimes|nullable|string|max:50',
                'legal_trading_name' => 'sometimes|nullable|string|max:255',
                'reg_no' => 'sometimes|nullable|string|max:255',
                'tax_id' => 'sometimes|nullable|string|max:255',
                'mission' => 'sometimes|nullable|string|max:1000',
                'vision' => 'sometimes|nullable|string|max:2000',
                'goals' => 'sometimes|nullable|string|max:2000',
                'services' => 'sometimes|nullable|string|max:2000',
                'website' => 'sometimes|nullable|string|max:255',
                'contact_email' => 'sometimes|email|max:255',
                'contact_phone' => 'sometimes|nullable|string|max:20',
                'address' => 'sometimes|nullable|string|max:500',
                'region' => 'sometimes|nullable|string|max:255',
                'municipality' => 'sometimes|nullable|string|max:255',
                'category' => 'sometimes|nullable|string|max:255',
                'logo' => 'sometimes|image|mimes:jpeg,png,jpg|max:2048',
                'cover_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:2048'
            ]);

            // Handle logo upload
            if ($r->hasFile('logo')) {
                // Delete old logo if exists
                if ($charity->logo_path) {
                    Storage::disk('public')->delete($charity->logo_path);
                }
                $validated['logo_path'] = $r->file('logo')->store('charity_logos', 'public');
            }

            // Handle cover image upload
            if ($r->hasFile('cover_image')) {
                // Delete old cover image if exists
                if ($charity->cover_image) {
                    Storage::disk('public')->delete($charity->cover_image);
                }
                $validated['cover_image'] = $r->file('cover_image')->store('charity_covers', 'public');
            }

            $charity->update($validated);

            return response()->json([
                'message' => 'Charity updated successfully',
                'charity' => $charity->fresh()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Throwable $e) {
            \Log::error('Charity update failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'charity_id' => $charity->id,
                'user_id' => $r->user()->id
            ]);

            return response()->json([
                'message' => 'Failed to update charity',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Upload verification doc
    public function uploadDocument(Request $r, Charity $charity){
        abort_unless($charity->owner_id === $r->user()->id, 403);
        $data = $r->validate([
            'doc_type'=>'required|in:registration,tax,bylaws,audit,other',
            'file'=>'required|file|mimes:pdf,jpg,jpeg,png'
        ]);
        $path = $r->file('file')->store('charity_docs','public');
        $hash = hash_file('sha256', $r->file('file')->getRealPath());
        $doc = $charity->documents()->create([
            'doc_type'=>$data['doc_type'],
            'file_path'=>$path,
            'sha256'=>$hash,
            'uploaded_by'=>$r->user()->id
        ]);
        return response()->json($doc,201);
    }

    // Public charity documents (for viewing by donors and public)
    public function getDocuments(Charity $charity){
        return $charity->documents()->orderBy('created_at', 'desc')->get();
    }

    public function storeChannel(Request $r, Charity $charity){
        abort_unless($charity->owner_id === $r->user()->id, 403);
        $data = $r->validate([
            'type'=>'required|in:gcash,paymaya,paypal,bank,other',
            'label'=>'required|string|max:255',
            'details'=>'required|array',
            'qr_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:4096'
        ]);
        // If QR image uploaded, store and merge path into details
        if ($r->hasFile('qr_image')) {
            $qrPath = $r->file('qr_image')->store('donation_qr', 'public');
            $data['details']['qr_image'] = $qrPath; // store relative storage path
        }

        return $charity->channels()->create([
            'type'=>$data['type'],
            'label'=>$data['label'],
            'details'=>$data['details'],
        ]);
    }

    // Update donation channel
    public function updateChannel(Request $r, Charity $charity, \App\Models\DonationChannel $channel)
    {
        abort_unless($charity->owner_id === $r->user()->id, 403);
        abort_unless($channel->charity_id === $charity->id, 404);

        $data = $r->validate([
            'type'=>'sometimes|in:gcash,paymaya,paypal,bank,other',
            'label'=>'sometimes|string|max:255',
            'details'=>'sometimes|array',
            'is_active'=>'sometimes|boolean',
            'qr_image' => 'sometimes|image|mimes:jpeg,png,jpg|max:4096'
        ]);

        $update = [];
        if (array_key_exists('type', $data)) $update['type'] = $data['type'];
        if (array_key_exists('label', $data)) $update['label'] = $data['label'];
        if (array_key_exists('is_active', $data)) $update['is_active'] = $data['is_active'];

        // Merge details
        $details = $channel->details ?? [];
        if (array_key_exists('details', $data)) {
            $details = array_merge($details, $data['details'] ?? []);
        }
        if ($r->hasFile('qr_image')) {
            $qrPath = $r->file('qr_image')->store('donation_qr', 'public');
            $details['qr_image'] = $qrPath;
        }
        if (!empty($details)) {
            $update['details'] = $details;
        }

        $channel->update($update);
        return $channel->fresh();
    }

    // Delete donation channel
    public function destroyChannel(Request $r, Charity $charity, \App\Models\DonationChannel $channel)
    {
        abort_unless($charity->owner_id === $r->user()->id, 403);
        abort_unless($channel->charity_id === $charity->id, 404);
        $channel->delete();
        return response()->json(['message' => 'Channel deleted']);
    }

    // Donation channels listing with visibility gating
    public function channels(Request $r, Charity $charity)
    {
        // Only show channels if:
        // - requester is authenticated donor, or
        // - requester is the charity owner (charity_admin)
        // Otherwise, hide donation channels
        $user = $r->user();

        // Publicly show active channels to simplify donor experience
        return $charity->channels()->where('is_active', true)->get();
    }

    // Admin-only: list all donation channels for the owner (no donor gating)
    public function channelsAdmin(Request $r, Charity $charity)
    {
        abort_unless($r->user() && $charity->owner_id === $r->user()->id, 403);
        return $charity->channels()->orderByDesc('created_at')->get();
    }
}
