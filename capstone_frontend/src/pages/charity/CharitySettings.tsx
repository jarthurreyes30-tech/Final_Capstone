import { useState, useEffect } from "react";
import { Bell, Mail, Globe, Shield, User, Save, Loader2, PlusCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { charityService } from "@/services/charity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function CharitySettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Donation Channels state
  const [channels, setChannels] = useState<any[]>([]);
  const [editingChannelId, setEditingChannelId] = useState<number | null>(null);
  const [channelForm, setChannelForm] = useState<{
    type: 'gcash' | 'paymaya' | 'paypal' | 'bank' | 'other';
    label: string;
    details: Record<string, any>;
    qr_image: File | null;
  }>({ type: 'gcash', label: '', details: {}, qr_image: null });
  const [savingChannel, setSavingChannel] = useState(false);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    donationAlerts: true,
    campaignUpdates: false,
    weeklyReports: true,
    publicProfile: true,
    showDonations: true,
    allowComments: true,
    autoConfirmDonations: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      });
      // load donation channels if charity exists
      const cid = user.charity?.id ? Number(user.charity.id) : null;
      if (cid) {
        charityService.getDonationChannels(cid).then((data) => {
          setChannels(Array.isArray(data) ? data : []);
        }).catch((error) => {
          console.warn('Could not load donation channels:', error.response?.status, error.response?.data);
          // Set empty array if channels can't be loaded
          setChannels([]);
        });
      }
    }
  }, [user]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      if (!response.ok) throw new Error('Failed to update profile');
      
      const updatedUser = await response.json();
      // Note: User data will be refreshed on next page load or manual refresh
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error('Profile update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    // TODO: API call to save settings
    toast.success("Settings saved successfully");
  };

  const handleChannelDetailChange = (key: string, value: string) => {
    setChannelForm((prev) => ({ ...prev, details: { ...prev.details, [key]: value } }));
  };

  const handleCreateChannel = async () => {
    try {
      if (!user?.charity?.id) {
        toast.error('No charity found for your account');
        return;
      }
      if (!channelForm.label.trim()) {
        toast.error('Please enter a label for the channel');
        return;
      }
      // Client-side required details validation to avoid backend 422
      if (channelForm.type === 'bank') {
        const missing: string[] = [];
        if (!channelForm.details?.bank_name) missing.push('Bank Name');
        if (!channelForm.details?.account_name) missing.push('Account Name');
        if (!channelForm.details?.account_number) missing.push('Account Number');
        if (missing.length) {
          toast.error(`Please provide: ${missing.join(', ')}`);
          return;
        }
      } else {
        const missing: string[] = [];
        if (!channelForm.details?.recipient) missing.push('Recipient Name');
        if (!channelForm.details?.number) missing.push('Number / Email');
        if (missing.length) {
          toast.error(`Please provide: ${missing.join(', ')}`);
          return;
        }
      }
      setSavingChannel(true);
      const cid = Number(user.charity.id);
      if (editingChannelId) {
        await charityService.updateDonationChannel(cid, editingChannelId, {
          type: channelForm.type,
          label: channelForm.label,
          details: channelForm.details,
          qr_image: channelForm.qr_image || undefined,
        });
        toast.success('Donation channel updated');
      } else {
        await charityService.createDonationChannel(cid, {
          type: channelForm.type,
          label: channelForm.label,
          details: channelForm.details,
          qr_image: channelForm.qr_image,
        });
        toast.success('Donation channel added');
      }
      // refresh list
      const data = await charityService.getDonationChannels(cid);
      setChannels(Array.isArray(data) ? data : []);
      // reset form
      setChannelForm({ type: 'gcash', label: '', details: {}, qr_image: null });
      setEditingChannelId(null);
    } catch (e: any) {
      const status = e?.response?.status;
      const msg = e?.response?.data?.message || e?.message || 'Failed to add channel';
      toast.error(`${msg}${status ? ` (HTTP ${status})` : ''}`);
    } finally {
      setSavingChannel(false);
    }
  };

  const handleEditChannel = (ch: any) => {
    setEditingChannelId(ch.id);
    setChannelForm({
      type: ch.type,
      label: ch.label,
      details: ch.details || {},
      qr_image: null,
    });
  };

  const handleCancelEdit = () => {
    setEditingChannelId(null);
    setChannelForm({ type: 'gcash', label: '', details: {}, qr_image: null });
  };

  const handleToggleActive = async (ch: any) => {
    try {
      if (!user?.charity?.id) return;
      const cid = Number(user.charity.id);
      await charityService.updateDonationChannel(cid, ch.id, { is_active: !ch.is_active });
      const data = await charityService.getDonationChannels(cid);
      setChannels(Array.isArray(data) ? data : []);
      toast.success(`Channel ${!ch.is_active ? 'activated' : 'deactivated'}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update channel status');
    }
  };

  const handleDeleteChannel = async (id: number) => {
    try {
      if (!user?.charity?.id) return;
      if (!confirm('Delete this channel? This cannot be undone.')) return;
      const cid = Number(user.charity.id);
      await charityService.deleteDonationChannel(cid, id);
      const data = await charityService.getDonationChannels(cid);
      setChannels(Array.isArray(data) ? data : []);
      // reset edit if same
      if (editingChannelId === id) handleCancelEdit();
      toast.success('Channel deleted');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete channel');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground text-sm">
            Manage your charity account preferences
          </p>
        </div>
        <Button onClick={handleSave}>
          Save Changes
        </Button>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <CardTitle>Profile Information</CardTitle>
          </div>
          <CardDescription>
            Update your personal information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleProfileChange('name', e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleProfileChange('email', e.target.value)}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={profileData.phone}
              onChange={(e) => handleProfileChange('phone', e.target.value)}
              placeholder="+63 9XX XXX XXXX"
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about your charity
              </p>
            </div>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={() => handleToggle('emailNotifications')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="donationAlerts">Donation Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when you receive new donations
              </p>
            </div>
            <Switch
              id="donationAlerts"
              checked={settings.donationAlerts}
              onCheckedChange={() => handleToggle('donationAlerts')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="campaignUpdates">Campaign Updates</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about your campaign progress
              </p>
            </div>
            <Switch
              id="campaignUpdates"
              checked={settings.campaignUpdates}
              onCheckedChange={() => handleToggle('campaignUpdates')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weeklyReports">Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get weekly summary of donations and activities
              </p>
            </div>
            <Switch
              id="weeklyReports"
              checked={settings.weeklyReports}
              onCheckedChange={() => handleToggle('weeklyReports')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Privacy</CardTitle>
          </div>
          <CardDescription>
            Control your charity's visibility and privacy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="publicProfile">Public Profile</Label>
              <p className="text-sm text-muted-foreground">
                Make your charity visible to donors
              </p>
            </div>
            <Switch
              id="publicProfile"
              checked={settings.publicProfile}
              onCheckedChange={() => handleToggle('publicProfile')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="showDonations">Show Donation Amounts</Label>
              <p className="text-sm text-muted-foreground">
                Display donation amounts publicly
              </p>
            </div>
            <Switch
              id="showDonations"
              checked={settings.showDonations}
              onCheckedChange={() => handleToggle('showDonations')}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowComments">Allow Comments</Label>
              <p className="text-sm text-muted-foreground">
                Let donors comment on your posts
              </p>
            </div>
            <Switch
              id="allowComments"
              checked={settings.allowComments}
              onCheckedChange={() => handleToggle('allowComments')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Donation Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>Donation Management</CardTitle>
          </div>
          <CardDescription>
            Configure how donations are handled
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoConfirmDonations">Auto-Confirm Donations</Label>
              <p className="text-sm text-muted-foreground">
                Automatically confirm donations without manual review
              </p>
            </div>
            <Switch
              id="autoConfirmDonations"
              checked={settings.autoConfirmDonations}
              onCheckedChange={() => handleToggle('autoConfirmDonations')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Donation Channels Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Donation Channels</CardTitle>
          </div>
          <CardDescription>Manage your payment methods and QR codes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing channels */}
          {channels.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {channels.map((ch) => (
                <div key={ch.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase">{ch.type}</p>
                      <h4 className="font-semibold">{ch.label}</h4>
                    </div>
                    <Badge variant="secondary">{ch.is_active ? 'Active' : 'Inactive'}</Badge>
                  </div>
                  {ch.details?.qr_image && (
                    <img src={`${import.meta.env.VITE_API_URL}/storage/${ch.details.qr_image}`} alt={`${ch.label} QR`} className="w-32 h-32 object-contain border rounded bg-white" />
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" onClick={() => handleEditChannel(ch)}>Edit</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggleActive(ch)}>
                      {ch.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteChannel(ch.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No donation channels yet.</p>
          )}

          <Separator />

          {/* Create new channel */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={channelForm.type} onValueChange={(v) => setChannelForm((p) => ({ ...p, type: v as any }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gcash">GCash</SelectItem>
                    <SelectItem value="paymaya">PayMaya</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Label</Label>
                <Input value={channelForm.label} onChange={(e) => setChannelForm((p) => ({ ...p, label: e.target.value }))} placeholder="e.g., GCash Main, BPI Corporate" />
              </div>
            </div>

            {/* Details fields */}
            {channelForm.type === 'bank' ? (
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Bank Name</Label>
                  <Input onChange={(e) => handleChannelDetailChange('bank_name', e.target.value)} placeholder="e.g., BPI" />
                </div>
                <div className="space-y-2">
                  <Label>Account Name</Label>
                  <Input onChange={(e) => handleChannelDetailChange('account_name', e.target.value)} placeholder="Organization Name" />
                </div>
                <div className="space-y-2">
                  <Label>Account Number</Label>
                  <Input onChange={(e) => handleChannelDetailChange('account_number', e.target.value)} placeholder="1234-5678-90" />
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Recipient Name</Label>
                  <Input onChange={(e) => handleChannelDetailChange('recipient', e.target.value)} placeholder="e.g., Charity Inc." />
                </div>
                <div className="space-y-2">
                  <Label>Number / Email</Label>
                  <Input onChange={(e) => handleChannelDetailChange('number', e.target.value)} placeholder="09xxxxxxxxx or email" />
                </div>
              </div>
            )}

            {/* QR Upload */}
            <div className="space-y-2">
              <Label>QR Image (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setChannelForm((p) => ({ ...p, qr_image: e.target.files?.[0] || null }))} />
              <p className="text-xs text-muted-foreground">JPG/PNG up to 4MB</p>
            </div>

            <div className="flex justify-end gap-2">
              {editingChannelId && (
                <Button variant="outline" onClick={handleCancelEdit} disabled={savingChannel}>
                  Cancel
                </Button>
              )}
              <Button onClick={handleCreateChannel} disabled={savingChannel}>
                {savingChannel ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    {editingChannelId ? 'Save Changes' : 'Add Channel'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Deactivate Account</p>
              <p className="text-sm text-muted-foreground">
                Temporarily disable your charity account
              </p>
            </div>
            <Button variant="outline">Deactivate</Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your charity account and all data
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
