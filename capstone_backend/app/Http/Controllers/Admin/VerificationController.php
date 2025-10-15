<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Charity;
use App\Models\AdminActionLog;
use Illuminate\Http\Request;
use App\Services\NotificationService;

class VerificationController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    public function index(){
        return Charity::with('owner')
            ->where('verification_status','pending')
            ->latest()
            ->paginate(20);
    }

    public function getAllCharities(){
        return Charity::with('owner')
            ->latest()
            ->paginate(20);
    }

    public function getUsers(){
        return \App\Models\User::latest()->paginate(20);
    }

    public function activateUser(\Illuminate\Http\Request $r, \App\Models\User $user){
        $user->update(['status'=>'active']);
        // Log admin action
        $admin = $r->user();
        if ($admin) {
            AdminActionLog::logAction(
                $admin->id,
                'activate_user',
                'User',
                $user->id,
                [
                    'target_email' => $user->email,
                    'previous_status' => $user->getOriginal('status'),
                    'new_status' => 'active',
                ]
            );
        }

        return response()->json(['message'=>'User activated']);
    }

    public function approve(Request $r, Charity $charity){
        $charity->update([
            'verification_status'=>'approved',
            'verified_at'=>now(),
            'verification_notes'=>$r->input('notes')
        ]);

        // Send notification to charity owner
        $this->notificationService->sendVerificationStatus($charity, 'approved');

        // Log admin action
        $admin = $r->user();
        if ($admin) {
            AdminActionLog::logAction(
                $admin->id,
                'approve_charity',
                'Charity',
                $charity->id,
                [
                    'charity_name' => $charity->name,
                    'owner_id' => $charity->owner_id ?? null,
                ],
                $r->input('notes')
            );
        }

        return response()->json(['message'=>'Approved']);
    }

    public function reject(Request $r, Charity $charity){
        $rejectionReason = $r->input('reason');
        $charity->update([
            'verification_status'=>'rejected',
            'rejection_reason' => $rejectionReason,
            'verification_notes'=>$r->input('notes')
        ]);

        // Send notification to charity owner
        $this->notificationService->sendVerificationStatus($charity, 'rejected');

        // Log admin action
        $admin = $r->user();
        if ($admin) {
            AdminActionLog::logAction(
                $admin->id,
                'reject_charity',
                'Charity',
                $charity->id,
                [
                    'charity_name' => $charity->name,
                    'owner_id' => $charity->owner_id ?? null,
                    'reason' => $rejectionReason,
                ],
                $r->input('notes')
            );
        }

        return response()->json(['message'=>'Rejected']);
    }

    public function suspendUser(Request $r, \App\Models\User $user){
        $user->update(['status'=>'suspended']);
        // Log admin action
        $admin = $r->user();
        if ($admin) {
            AdminActionLog::logAction(
                $admin->id,
                'suspend_user',
                'User',
                $user->id,
                [
                    'target_email' => $user->email,
                    'previous_status' => $user->getOriginal('status'),
                    'new_status' => 'suspended',
                ]
            );
        }

        return response()->json(['message'=>'User suspended']);
    }
}
