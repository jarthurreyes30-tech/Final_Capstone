import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, MapPin, Globe, Phone, Mail, Calendar, Award, Users, TrendingUp, FileText, Target, DollarSign, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { authService } from "@/services/auth";

interface CharityProfile {
  id: number;
  name: string;
  acronym?: string;
  mission: string;
  vision?: string;
  goals?: string;
  category?: string;
  region?: string;
  municipality?: string;
  logo_path?: string;
  cover_image?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  verification_status: string;
  verified_at?: string;
  total_received?: number;
  documents?: any[];
}

interface Update {
  id: number;
  title: string;
  content: string;
  media_urls?: string[];
  is_pinned?: boolean;
  created_at: string;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

interface Campaign {
  id: number;
  title?: string;
  description?: string;
  target_amount?: number;
  goal_amount?: number;
  current_amount?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  cover_image_path?: string;
  image_path?: string;
  banner_image?: string;
  created_at?: string;
}

export default function CharityProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [charity, setCharity] = useState<CharityProfile | null>(null);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  useEffect(() => {
    if (id) {
      loadCharityProfile();
      loadCharityUpdates();
      loadCharityCampaigns();
      checkFollowStatus();
    }
  }, [id]);

  const loadCharityProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/charities/${id}`);
      if (response.ok) {
        const data = await response.json();
        setCharity(data);
      }
    } catch (error) {
      console.error('Error loading charity profile:', error);
      toast.error('Failed to load charity profile');
    }
  };

  const loadCharityUpdates = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/charities/${id}/updates`);
      if (response.ok) {
        const data = await response.json();
        const updatesArray = data.data || data || [];
        console.log('Updates received:', updatesArray);
        // Filter out any null/undefined items
        const validUpdates = Array.isArray(updatesArray) ? updatesArray.filter(u => u && u.id) : [];
        setUpdates(validUpdates);
      }
    } catch (error) {
      console.error('Error loading charity updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCharityCampaigns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/charities/${id}/campaigns`);
      if (response.ok) {
        const data = await response.json();
        const campaignsArray = data.data || data || [];
        console.log('Campaigns received:', campaignsArray);
        // Filter out any null/undefined items
        const validCampaigns = Array.isArray(campaignsArray) ? campaignsArray.filter(c => c && c.id) : [];
        setCampaigns(validCampaigns);
      }
    } catch (error) {
      console.error('Error loading charity campaigns:', error);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/charities/${id}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.is_following);
      }
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const handleFollowToggle = async () => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error('Please login to follow charities');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/charities/${id}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.is_following);
        toast.success(data.message);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading charity profile...</p>
        </div>
      </div>
    );
  }

  if (!charity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground mb-2">Charity Not Found</h1>
          <p className="text-muted-foreground">The charity you're looking for doesn't exist or isn't available.</p>
          <Button className="mt-4" onClick={() => navigate('/donor/charities')}>
            Back to Charities
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-primary/20 to-secondary/20">
        {charity.cover_image && (
          <img
            src={`${import.meta.env.VITE_API_URL}/storage/${charity.cover_image}`}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* Profile Header */}
      <div className="relative px-4 pb-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-6 -mt-16 md:-mt-20">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background bg-background p-2">
                {charity.logo_path ? (
                  <img
                    src={`${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}`}
                    alt={charity.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-muted flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {charity.acronym || charity.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Charity Info */}
            <div className="flex-1 pt-4 md:pt-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{charity.name}</h1>
                  {charity.acronym && (
                    <p className="text-lg text-muted-foreground">{charity.acronym}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {charity.verification_status === 'approved' && (
                      <Badge className="bg-green-600">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {charity.category && (
                      <Badge variant="outline">{charity.category}</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleFollowToggle}>
                    <Heart className={`w-4 h-4 mr-2 ${isFollowing ? 'fill-current text-red-500' : ''}`} />
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                  <Button variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900">
                  <div className="text-2xl font-bold text-green-600">
                    ₱{charity.total_received?.toLocaleString() || '0'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Raised</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                  <div className="text-2xl font-bold text-blue-600">{campaigns?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Campaigns</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900">
                  <div className="text-2xl font-bold text-purple-600">{updates?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">Updates</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-8">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="updates">
                Updates {updates && updates.length > 0 && <Badge variant="secondary" className="ml-2">{updates.length}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                Campaigns {campaigns && campaigns.length > 0 && <Badge variant="secondary" className="ml-2">{campaigns.length}</Badge>}
              </TabsTrigger>
            </TabsList>

            {/* About Tab */}
            <TabsContent value="about" className="space-y-6 mt-6">
              {/* Mission & Vision */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{charity.mission}</p>
                  </CardContent>
                </Card>

                {charity.vision && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Vision
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{charity.vision}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {charity.contact_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.contact_email}</span>
                      </div>
                    )}
                    {charity.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.contact_phone}</span>
                      </div>
                    )}
                    {charity.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <a href={charity.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {charity.website}
                        </a>
                      </div>
                    )}
                    {charity.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{charity.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Documents */}
              {charity.documents && charity.documents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Documents & Certificates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {charity.documents.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div>
                            <p className="font-medium">{doc.doc_type}</p>
                            <p className="text-sm text-muted-foreground">Uploaded {new Date(doc.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Updates Tab */}
            <TabsContent value="updates" className="mt-6">
              <div className="max-w-2xl mx-auto space-y-3">
                {!updates || updates.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No updates yet. Check back later for news from {charity.name}!</p>
                    </CardContent>
                  </Card>
                ) : (
                  updates.filter(update => update && update.id).map((update) => (
                  <Card key={update.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border/40">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <Avatar className="w-9 h-9 ring-2 ring-primary/10 flex-shrink-0">
                            <AvatarImage src={charity.logo_path ? `${import.meta.env.VITE_API_URL}/storage/${charity.logo_path}` : undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                              {charity.acronym || charity.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <p className="font-semibold text-sm">{charity.name}</p>
                              {charity.verification_status === 'approved' && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                  <Award className="h-2.5 w-2.5 mr-0.5" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {new Date(update.created_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        {update.is_pinned && (
                          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 flex-shrink-0 text-[10px] px-2 py-0.5 h-5">
                            <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                            Pinned
                          </Badge>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-2.5 pt-0 px-4 pb-3">
                      {/* Title */}
                      {update.title && (
                        <h3 className="font-bold text-base text-foreground leading-snug">
                          {update.title}
                        </h3>
                      )}
                      
                      {/* Content */}
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <p className="text-sm text-foreground leading-normal whitespace-pre-wrap">
                          {update.content}
                        </p>
                      </div>
                      
                      {/* Media Gallery */}
                      {update.media_urls && update.media_urls.length > 0 && (
                        <div className={`grid gap-2 ${
                          update.media_urls.length === 1 
                            ? 'grid-cols-1' 
                            : update.media_urls.length === 2 
                            ? 'grid-cols-2' 
                            : 'grid-cols-2 md:grid-cols-3'
                        }`}>
                          {update.media_urls.map((url, idx) => (
                            <div 
                              key={idx} 
                              className={`relative overflow-hidden rounded-md group cursor-pointer ${
                                update.media_urls!.length === 1 ? 'aspect-video' : 'aspect-square'
                              }`}
                            >
                              <img
                                src={`${import.meta.env.VITE_API_URL}/storage/${url}`}
                                alt={`Update media ${idx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Interaction Buttons */}
                      <div className="flex items-center gap-0.5 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/20">
                          <Heart className="w-3.5 h-3.5 mr-1.5" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/20">
                          <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                          Comment
                        </Button>
                        <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/20">
                          <Share2 className="w-3.5 h-3.5 mr-1.5" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
              </div>
            </TabsContent>

            {/* Campaigns Tab */}
            <TabsContent value="campaigns" className="space-y-4 mt-6">
              {!campaigns || campaigns.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No active campaigns at the moment.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.filter(campaign => campaign && campaign.id).map((campaign) => {
                    const currentAmount = campaign.current_amount || 0;
                    const goalAmount = campaign.target_amount || campaign.goal_amount || 1;
                    const progress = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);
                    const daysLeft = campaign.end_date ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0;
                    
                    // Debug logging
                    console.log('Campaign:', campaign.id, 'Image path:', campaign.cover_image_path, 'Full URL:', `${import.meta.env.VITE_API_URL}/storage/${campaign.cover_image_path}`);
                    
                    // Status configuration
                    const statusConfig: Record<string, { label: string; color: string }> = {
                      active: { label: "Active", color: "bg-green-500 hover:bg-green-600" },
                      completed: { label: "Completed", color: "bg-blue-500 hover:bg-blue-600" },
                      draft: { label: "Draft", color: "bg-yellow-500 hover:bg-yellow-600" },
                      expired: { label: "Expired", color: "bg-red-500 hover:bg-red-600" },
                    };
                    const status = statusConfig[campaign.status || 'active'] || statusConfig.active;
                    
                    return (
                      <Card key={campaign.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-border/40">
                        {/* Banner Image */}
                        <div className="relative h-[180px] overflow-hidden bg-muted">
                          {(campaign.cover_image_path || campaign.image_path || campaign.banner_image) ? (
                            <img
                              src={`${import.meta.env.VITE_API_URL}/storage/${campaign.cover_image_path || campaign.image_path || campaign.banner_image}`}
                              alt={campaign.title}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                console.log('Image failed to load:', campaign.cover_image_path || campaign.image_path);
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5"><svg class="w-16 h-16 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path d="M12 6v6l4 2" stroke-width="2" stroke-linecap="round"/></svg></div>';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                              <Target className="w-16 h-16 text-muted-foreground/30" />
                            </div>
                          )}
                          
                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                          
                          {/* Status Badge */}
                          <div className="absolute top-3 left-3">
                            <Badge className={`${status.color} text-white border-0 shadow-lg px-3 py-1 text-xs font-semibold`}>
                              {status.label}
                            </Badge>
                          </div>
                        </div>

                        {/* Content */}
                        <CardHeader className="pb-2">
                          <h3 className="text-lg font-bold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                            {campaign.title || 'Untitled Campaign'}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {campaign.description || 'No description available'}
                          </p>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* Progress Bar */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Progress</span>
                              <span className="text-primary font-bold">{progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            {/* Left Column */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Raised</p>
                                  <p className="text-sm font-bold text-foreground">
                                    ₱{currentAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-purple-600 dark:text-purple-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Days Left</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    {daysLeft > 0 ? daysLeft : "Ended"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-2">
                              <div className="flex items-start gap-1.5">
                                <Target className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">Goal</p>
                                  <p className="text-sm font-bold text-foreground">
                                    ₱{goalAmount.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <DollarSign className="h-3.5 w-3.5 text-blue-600 dark:text-blue-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-[10px] text-muted-foreground">To Go</p>
                                  <p className="text-sm font-semibold text-foreground">
                                    ₱{Math.max(0, goalAmount - currentAmount).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <Button 
                            className="w-full h-9 bg-primary hover:bg-primary/90 text-sm" 
                            onClick={() => navigate(`/donor/donate/${charity.id}`)}
                          >
                            <Heart className="w-3.5 h-3.5 mr-1.5" />
                            Donate Now
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
