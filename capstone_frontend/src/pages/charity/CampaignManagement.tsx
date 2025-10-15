import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Calendar, Target, Grid3x3, List } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { campaignService, Campaign as ApiCampaign, DonationChannel } from "@/services/campaigns";
import { charityService } from "@/services/charity";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CampaignCard, Campaign as CampaignCardType } from "@/components/charity/CampaignCard";
import { CampaignCardSkeleton } from "@/components/charity/CampaignCardSkeleton";

interface Campaign {
  id: number;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  donation_type: 'one_time' | 'recurring';
  cover_image_path?: string;
  charity_id: number;
}

export default function CampaignManagement() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    problem: "",
    solution: "",
    expectedOutcome: "",
    targetAmount: "",
    startDate: "",
    endDate: "",
    donationType: "one_time" as "one_time" | "recurring",
    status: "published" as "draft" | "published" | "closed" | "archived",
    image: null as File | null
  });

  const [channels, setChannels] = useState<DonationChannel[]>([]);

  useEffect(() => {
    loadCampaigns();
    loadChannels();
  }, []);

  const loadCampaigns = async () => {
    try {
      if (!user?.charity?.id) {
        toast.error("No charity found for your account");
        setLoading(false);
        return;
      }

      const response = await campaignService.getCampaigns(user.charity.id);
      const formattedCampaigns = response.data.map((campaign: ApiCampaign) => ({
        id: campaign.id,
        title: campaign.title,
        description: campaign.description || "",
        target_amount: campaign.target_amount || 0,
        current_amount: campaign.current_amount || 0,
        start_date: campaign.start_date || "",
        end_date: campaign.end_date || "",
        status: campaign.status,
        donation_type: campaign.donation_type,
        cover_image_path: campaign.cover_image_path,
        charity_id: campaign.charity_id
      }));
      setCampaigns(formattedCampaigns);
    } catch (error: any) {
      console.error("Failed to load campaigns:", error);
      toast.error(error.response?.data?.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const loadChannels = async () => {
    try {
      if (!user?.charity?.id) return;
      const data = await charityService.getDonationChannels(Number(user.charity.id));
      const list = Array.isArray(data) ? data : [];
      setChannels(list);
      // If no channel selected yet, preselect the first available one for convenience
      if (!formData.donationChannelId && list.length > 0) {
        setFormData((prev) => ({ ...prev, donationChannelId: String(list[0].id) }));
      }
    } catch (e) {
      // ignore silently if forbidden for unauthenticated
      setChannels([]);
    }
  };

  const handleCreate = async () => {
    try {
      if (!user?.charity?.id) {
        toast.error("No charity found for your account");
        return;
      }

      if (!formData.title || !formData.targetAmount) {
        toast.error("Please fill in all required fields");
        return;
      }

      setSubmitting(true);

      const data = {
        title: formData.title,
        description: formData.description,
        problem: formData.problem,
        solution: formData.solution,
        expected_outcome: formData.expectedOutcome,
        target_amount: parseFloat(formData.targetAmount),
        start_date: formData.startDate,
        end_date: formData.endDate,
        donation_type: formData.donationType,
        status: formData.status,
        cover_image: formData.image || undefined
      };

      await campaignService.createCampaign(user.charity.id, data);
      toast.success("Campaign created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      loadCampaigns();
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      const msg = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Failed to create campaign';
      const errs = error?.response?.data?.errors;
      if (errs && typeof errs === 'object') {
        const first = Object.values(errs)[0] as any;
        const firstMsg = Array.isArray(first) ? first[0] : String(first);
        toast.error(`${msg}: ${firstMsg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return "";
    // Convert ISO datetime to yyyy-MM-dd format
    return dateString.split("T")[0];
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      title: campaign.title,
      description: campaign.description,
      problem: (campaign as any).problem || "",
      solution: (campaign as any).solution || "",
      expectedOutcome: (campaign as any).expected_outcome || "",
      targetAmount: campaign.target_amount.toString(),
      startDate: formatDateForInput(campaign.start_date),
      endDate: formatDateForInput(campaign.end_date),
      donationType: campaign.donation_type,
      status: campaign.status,
      image: null
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (!selectedCampaign) return;

      if (!formData.title || !formData.targetAmount) {
        toast.error("Please fill in all required fields");
        return;
      }

      setSubmitting(true);

      const data = {
        title: formData.title,
        description: formData.description,
        target_amount: parseFloat(formData.targetAmount),
        start_date: formData.startDate,
        end_date: formData.endDate,
        donation_type: formData.donationType,
        status: formData.status,
        cover_image: formData.image || undefined
      };

      await campaignService.updateCampaign(selectedCampaign.id, data);
      toast.success("Campaign updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      loadCampaigns();
    } catch (error: any) {
      console.error("Failed to update campaign:", error);
      toast.error(error.response?.data?.message || "Failed to update campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await campaignService.deleteCampaign(id);
      toast.success("Campaign deleted successfully");
      loadCampaigns();
    } catch (error: any) {
      console.error("Failed to delete campaign:", error);
      toast.error(error.response?.data?.message || "Failed to delete campaign");
    }
  };

  const handleView = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsViewDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      problem: "",
      solution: "",
      expectedOutcome: "",
      targetAmount: "",
      startDate: "",
      endDate: "",
      donationType: "one_time",
      status: "published" as "draft" | "published" | "closed" | "archived",
      image: null
    });
    setSelectedCampaign(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-600">Published</Badge>;
      case 'closed':
        return <Badge className="bg-blue-600">Closed</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'archived':
        return <Badge variant="outline">Archived</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getDonationTypeBadge = (type: string) => {
    return type === 'recurring' 
      ? <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Recurring</Badge>
      : <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">One-Time</Badge>;
  };

  const getProgress = (current: number, target: number) => {
    return (current / target) * 100;
  };

  // Convert Campaign to CampaignCardType
  const convertToCampaignCard = (campaign: Campaign): CampaignCardType => {
    // Map status
    let cardStatus: "active" | "completed" | "draft" | "expired" = "draft";
    if (campaign.status === "published") cardStatus = "active";
    else if (campaign.status === "closed") cardStatus = "completed";
    else if (campaign.status === "archived") cardStatus = "expired";
    else cardStatus = "draft";

    return {
      id: campaign.id,
      title: campaign.title,
      description: campaign.description,
      goal: campaign.target_amount,
      amountRaised: campaign.current_amount,
      donorsCount: 0, // TODO: Get from API
      views: 0, // TODO: Get from API
      status: cardStatus,
      bannerImage: campaign.cover_image_path,
      endDate: campaign.end_date,
      createdAt: campaign.start_date,
    };
  };

  const handleCardEdit = (id: number) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (campaign) handleEdit(campaign);
  };

  const handleCardDelete = (id: number) => {
    handleDelete(id);
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    try {
      // When pausing, keep as published but you might want a "paused" status
      // For now, toggle between published and draft
      let newStatus: "draft" | "published" | "closed" | "archived";
      
      if (campaign.status === "published") {
        newStatus = "draft"; // Pausing
      } else {
        newStatus = "published"; // Activating
      }
      
      await campaignService.updateCampaign(id, {
        ...campaign,
        status: newStatus,
      });
      
      toast.success(`Campaign ${newStatus === "published" ? "activated" : "paused"} successfully`);
      loadCampaigns();
    } catch (error: any) {
      console.error("Failed to update campaign status:", error);
      toast.error("Failed to update campaign status");
    }
  };

  const handleShare = (id: number) => {
    const campaign = campaigns.find((c) => c.id === id);
    if (!campaign) return;

    const shareUrl = `${window.location.origin}/campaigns/${id}`;
    
    if (navigator.share) {
      navigator.share({
        title: campaign.title,
        text: campaign.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Campaign link copied to clipboard");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground text-sm">
            Create and manage your fundraising campaigns
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 border rounded-md p-1">
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.filter(c => c.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{campaigns.reduce((sum, c) => sum + c.current_amount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns View */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle>All Campaigns</CardTitle>
            <CardDescription>Manage your fundraising campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Loading campaigns...</div>
            ) : campaigns.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No campaigns yet. Create your first campaign to start fundraising!</div>
            ) : (
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{campaign.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {campaign.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getDonationTypeBadge(campaign.donation_type)}</TableCell>
                  <TableCell>₱{campaign.target_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Progress value={getProgress(campaign.current_amount, campaign.target_amount)} />
                      <p className="text-xs text-muted-foreground">
                        ₱{campaign.current_amount.toLocaleString()} / ₱{campaign.target_amount.toLocaleString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {campaign.start_date && <p>{new Date(campaign.start_date).toLocaleDateString()}</p>}
                      {campaign.end_date && <p className="text-muted-foreground">to {new Date(campaign.end_date).toLocaleDateString()}</p>}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleView(campaign)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Card View */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">No campaigns yet</p>
              <p className="text-muted-foreground text-sm mt-2">
                Create your first campaign to start fundraising!
              </p>
              <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={convertToCampaignCard(campaign)}
                viewMode="admin"
                onEdit={handleCardEdit}
                onDelete={handleCardDelete}
                onToggleStatus={handleToggleStatus}
                onShare={handleShare}
              />
            ))}
          </div>
        )
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Campaign</DialogTitle>
            <DialogDescription>Fill in the details for your new fundraising campaign</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Campaign Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Education Fund 2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your campaign goals and impact"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="problem">⚠️ The Problem</Label>
              <Textarea
                id="problem"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                placeholder="What issue are you addressing?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="solution">💡 The Solution</Label>
              <Textarea
                id="solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                placeholder="How will you solve the problem?"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedOutcome">🎯 Expected Outcome</Label>
              <Textarea
                id="expectedOutcome"
                value={formData.expectedOutcome}
                onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                placeholder="What impact do you expect?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donationType">Donation Type *</Label>
                <Select
                  value={formData.donationType}
                  onValueChange={(value: "one_time" | "recurring") => setFormData({ ...formData, donationType: value })}
                >
                  <SelectTrigger id="donationType">
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time Donations</SelectItem>
                    <SelectItem value="recurring">Recurring Donations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Donation channels are not selected per campaign; all available channels are displayed to donors. */}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (₱) *</Label>
                <Input
                  id="targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  placeholder="100000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Campaign Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting}>{submitting ? "Creating..." : "Create Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>Update your campaign details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Campaign Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-problem">⚠️ The Problem</Label>
              <Textarea
                id="edit-problem"
                value={formData.problem}
                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-solution">💡 The Solution</Label>
              <Textarea
                id="edit-solution"
                value={formData.solution}
                onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expectedOutcome">🎯 Expected Outcome</Label>
              <Textarea
                id="edit-expectedOutcome"
                value={formData.expectedOutcome}
                onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-donationType">Donation Type *</Label>
                <Select
                  value={formData.donationType}
                  onValueChange={(value: "one_time" | "recurring") => setFormData({ ...formData, donationType: value })}
                >
                  <SelectTrigger id="edit-donationType">
                    <SelectValue placeholder="Select donation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time Donations</SelectItem>
                    <SelectItem value="recurring">Recurring Donations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "draft" | "published" | "closed" | "archived") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Donation channels are not edited per campaign; donors see all available charity channels. */}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-targetAmount">Target Amount (₱) *</Label>
                <Input
                  id="edit-targetAmount"
                  type="number"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-image">Campaign Image</Label>
                <Input
                  id="edit-image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-startDate">Start Date</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-endDate">End Date</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={submitting}>{submitting ? "Updating..." : "Update Campaign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Campaign Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.title}</DialogTitle>
            <DialogDescription>Campaign Details</DialogDescription>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div>
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">{selectedCampaign.description}</p>
              </div>
              <div>
                <Label>⚠️ The Problem</Label>
                <p className="text-sm text-muted-foreground mt-1">{(selectedCampaign as any).problem || '—'}</p>
              </div>
              <div>
                <Label>💡 The Solution</Label>
                <p className="text-sm text-muted-foreground mt-1">{(selectedCampaign as any).solution || '—'}</p>
              </div>
              <div>
                <Label>🎯 Expected Outcome</Label>
                <p className="text-sm text-muted-foreground mt-1">{(selectedCampaign as any).expected_outcome || '—'}</p>
              </div>
              <div>
                <Label>Donation Channel</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {(() => {
                    const id = (selectedCampaign as any).donation_channel_id;
                    const ch = channels.find(c => c.id === id);
                    return ch ? ch.label : '—';
                  })()}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Donation Type</Label>
                  <div className="mt-1">{getDonationTypeBadge(selectedCampaign.donation_type)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Amount</Label>
                  <p className="text-lg font-bold">₱{selectedCampaign.target_amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Current Amount</Label>
                  <p className="text-lg font-bold text-green-600">₱{selectedCampaign.current_amount.toLocaleString()}</p>
                </div>
              </div>
              <div>
                <Label>Progress</Label>
                <Progress value={getProgress(selectedCampaign.current_amount, selectedCampaign.target_amount)} className="mt-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  {getProgress(selectedCampaign.current_amount, selectedCampaign.target_amount).toFixed(1)}% achieved
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <p className="text-sm">{selectedCampaign.start_date ? new Date(selectedCampaign.start_date).toLocaleDateString() : 'Not set'}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p className="text-sm">{selectedCampaign.end_date ? new Date(selectedCampaign.end_date).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
