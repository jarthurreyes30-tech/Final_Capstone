import { useState, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  TrendingUp,
  Filter,
  ArrowUpDown,
  ExternalLink,
  Target,
  Sparkles,
  ChevronDown,
  Send,
  Trash2,
  CheckCircle2,
  Calendar,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";

const API_URL = import.meta.env.VITE_API_URL;

interface Update {
  id: number;
  charity_id: number;
  content: string;
  media_urls: string[];
  created_at: string;
  is_pinned: boolean;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
  charity?: {
    id: number;
    name: string;
    logo_path?: string;
  };
}

interface Comment {
  id: number;
  update_id: number;
  user_id: number;
  content: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
    role: string;
  };
}

interface Campaign {
  id: number;
  title: string;
  cover_image_path?: string;
  current_amount: number;
  target_amount: number;
  charity?: { name: string };
}

type CurrentUser = { id: number; role: string; name?: string } | null;

export default function CommunityFeed() {
  const navigate = useNavigate();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [filteredUpdates, setFilteredUpdates] = useState<Update[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "supported" | "liked">("all");
  const [sortType, setSortType] = useState<"newest" | "popular">("newest");
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [supportedCharityIds, setSupportedCharityIds] = useState<number[]>([]);
  const [trendingCampaigns, setTrendingCampaigns] = useState<Campaign[]>([]);
  const [suggestedCharities, setSuggestedCharities] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = authService.getToken();
        if (!token) return;
        const me = await authService.getCurrentUser();
        // @ts-expect-error runtime shape
        setCurrentUser(me as any);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [updates, filterType, sortType, supportedCharityIds]);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([
      fetchSupportedCharities(),
      fetchUpdates(),
      fetchTrendingCampaigns(),
      fetchSuggestedCharities(),
    ]);
    setLoading(false);
  };

  const fetchSupportedCharities = async () => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/me/donations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const donations = (data.data || data) as any[];
        const charityIds = Array.from(new Set<number>(donations.map((d: any) => Number(d.charity_id))));
        setSupportedCharityIds(charityIds as number[]);
      }
    } catch (error) {
      console.error("Failed to fetch supported charities");
    }
  };

  const fetchUpdates = async () => {
    try {
      const res = await fetch(`${API_URL}/api/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities = charitiesData.charities?.data || charitiesData.data || charitiesData;

      const allUpdates: Update[] = [];

      for (const charity of charities.slice(0, 10)) {
        try {
          const updatesRes = await fetch(`${API_URL}/api/charities/${charity.id}/updates`, {
            headers: {
              Accept: "application/json",
              ...(authService.getToken() && {
                Authorization: `Bearer ${authService.getToken()}`,
              }),
            },
          });

          if (updatesRes.ok) {
            const updatesData = await updatesRes.json();
            const charityUpdates = updatesData.data || updatesData;

            if (Array.isArray(charityUpdates)) {
              const updatesWithCharity = charityUpdates.map((u: any) => ({
                ...u,
                charity: {
                  id: charity.id,
                  name: charity.name,
                  logo_path: charity.logo_path,
                },
              }));
              allUpdates.push(...updatesWithCharity);
            }
          }
        } catch (error) {
          // Skip
        }
      }

      setUpdates(allUpdates);
    } catch (error) {
      toast.error("Failed to load community feed");
    }
  };

  const fetchTrendingCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities = charitiesData.charities?.data || charitiesData.data || charitiesData;

      const allCampaigns: Campaign[] = [];

      for (const charity of charities.slice(0, 5)) {
        try {
          const campaignsRes = await fetch(`${API_URL}/api/charities/${charity.id}/campaigns`);
          if (campaignsRes.ok) {
            const campaignsData = await campaignsRes.json();
            const campaigns = campaignsData.data || campaignsData;

            if (Array.isArray(campaigns)) {
              const published = campaigns
                .filter((c: any) => c.status === "published")
                .map((c: any) => ({ ...c, charity: { name: charity.name } }));
              allCampaigns.push(...published);
            }
          }
        } catch (error) {
          // Skip
        }
      }

      const sorted = allCampaigns.sort((a, b) => {
        const progressA = (a.current_amount / a.target_amount) * 100;
        const progressB = (b.current_amount / b.target_amount) * 100;
        return progressB - progressA;
      });

      setTrendingCampaigns(sorted.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch campaigns");
    }
  };

  const fetchSuggestedCharities = async () => {
    try {
      const res = await fetch(`${API_URL}/api/charities`);
      if (!res.ok) return;

      const charitiesData = await res.json();
      const charities = charitiesData.charities?.data || charitiesData.data || charitiesData;

      const unsupported = charities.filter(
        (c: any) => !supportedCharityIds.includes(c.id)
      );

      setSuggestedCharities(unsupported.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch suggested charities");
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...updates];

    if (filterType === "supported") {
      filtered = filtered.filter((u) => supportedCharityIds.includes(u.charity_id));
    } else if (filterType === "liked") {
      filtered = filtered.filter((u) => u.is_liked);
    }

    if (sortType === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortType === "popular") {
      filtered.sort((a, b) => b.likes_count - a.likes_count);
    }

    setFilteredUpdates(filtered);
  };

  const handleLike = async (updateId: number) => {
    try {
      const token = authService.getToken();
      if (!token) {
        toast.error("Please log in to like posts");
        return;
      }

      const res = await fetch(`${API_URL}/api/updates/${updateId}/like`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? { ...u, is_liked: data.liked, likes_count: data.likes_count }
              : u
          )
        );
        toast.success(data.liked ? "Liked!" : "Unliked");
      }
    } catch (error) {
      toast.error("Failed to like post");
    }
  };

  const toggleComments = async (updateId: number) => {
    const isExpanded = expandedComments.has(updateId);

    if (isExpanded) {
      setExpandedComments((prev) => {
        const next = new Set(prev);
        next.delete(updateId);
        return next;
      });
    } else {
      setExpandedComments((prev) => new Set(prev).add(updateId));
      if (!comments[updateId]) {
        await fetchComments(updateId);
      }
    }
  };

  const fetchComments = async (updateId: number) => {
    try {
      const token = authService.getToken();
      const res = await fetch(`${API_URL}/api/updates/${updateId}/comments`, {
        headers: {
          Accept: "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => ({ ...prev, [updateId]: data.data || data }));
      }
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  const handleAddComment = async (updateId: number) => {
    const content = newComment[updateId]?.trim();
    if (!content) return;

    try {
      const token = authService.getToken();
      if (!token) {
        toast.error("Please log in to comment");
        return;
      }

      const res = await fetch(`${API_URL}/api/updates/${updateId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newCommentData = await res.json();
        setComments((prev) => ({
          ...prev,
          [updateId]: [...(prev[updateId] || []), newCommentData],
        }));
        setNewComment((prev) => ({ ...prev, [updateId]: "" }));
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId ? { ...u, comments_count: u.comments_count + 1 } : u
          )
        );
        toast.success("Comment added!");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    }
  };

  const handleDeleteComment = async (commentId: number, updateId: number) => {
    try {
      const token = authService.getToken();
      if (!token) return;

      const res = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (res.ok) {
        setComments((prev) => ({
          ...prev,
          [updateId]: prev[updateId].filter((c) => c.id !== commentId),
        }));
        setUpdates((prev) =>
          prev.map((u) =>
            u.id === updateId
              ? { ...u, comments_count: Math.max(0, u.comments_count - 1) }
              : u
          )
        );
        toast.success("Comment deleted");
      }
    } catch (error) {
      toast.error("Failed to delete comment");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-muted rounded-full"></div>
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="h-4 bg-muted rounded w-full"></div>
                      <div className="h-32 bg-muted rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Community Feed</h1>
          <p className="text-muted-foreground mb-6">
            See the latest updates and stories from charities you support.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  {filterType === "all" && "All Charities"}
                  {filterType === "supported" && "Charities I Support"}
                  {filterType === "liked" && "My Liked Posts"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterType("all")}>
                  All Charities
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("supported")}>
                  Charities I Support
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterType("liked")}>
                  My Liked Posts
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  {sortType === "newest" && "Newest"}
                  {sortType === "popular" && "Most Popular"}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortType("newest")}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortType("popular")}>
                  Most Popular
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {filteredUpdates.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    Your feed is waiting to be filled!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Support a charity to start seeing their updates here.
                  </p>
                  <Button onClick={() => navigate("/donor/discover")}>
                    <Target className="mr-2 h-4 w-4" />
                    Discover Campaigns
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredUpdates.map((update) => (
                <Card key={update.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="w-10 h-10 cursor-pointer"
                          onClick={() => navigate(`/donor/charities/${update.charity_id}`)}
                        >
                          <AvatarImage
                            src={
                              update.charity?.logo_path
                                ? `${API_URL}/storage/${update.charity.logo_path}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            {update.charity?.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3
                              className="text-base md:text-lg font-semibold leading-tight hover:underline cursor-pointer"
                              onClick={() => navigate(`/donor/charities/${update.charity_id}`)}
                            >
                              {update.charity?.name}
                            </h3>
                            <Badge variant="secondary" className="text-[10px] md:text-xs px-2 py-0.5">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {formatTimeAgo(update.created_at)}
                          </p>
                        </div>
                      </div>
                      {update.is_pinned && (
                        <Badge variant="outline" className="text-[10px] md:text-xs">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-foreground">{update.content}</p>

                    {update.media_urls && update.media_urls.length > 0 && (
                      <div
                        className={`grid gap-2 ${
                          update.media_urls.length === 1 ? "grid-cols-1" : "grid-cols-2"
                        }`}
                      >
                        {update.media_urls.map((url, idx) => (
                          <div key={idx} className="rounded-lg overflow-hidden">
                            <img
                              src={`${API_URL}/storage/${url}`}
                              alt={`Update media ${idx + 1}`}
                              className="w-full h-auto max-h-96 object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground">
                      <span>{update.likes_count} likes</span>
                      <span>{update.comments_count} comments</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={update.is_liked ? "default" : "ghost"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLike(update.id)}
                      >
                        <Heart
                          className={`mr-2 h-4 w-4 ${update.is_liked ? "fill-current" : ""}`}
                        />
                        {update.is_liked ? "Liked" : "Like"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1"
                        onClick={() => toggleComments(update.id)}
                      >
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Comment
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/donor/charities/${update.charity_id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedComments.has(update.id) && (
                      <div className="space-y-4 pt-4 border-t">
                        <ScrollArea className="max-h-96">
                          <div className="space-y-3">
                            {comments[update.id]?.map((comment) => (
                              <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback>
                                    {comment.user?.name?.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm">
                                        {comment.user?.name}
                                      </span>
                                      {comment.user?.role === "charity_admin" && (
                                        <Badge variant="secondary" className="text-xs">
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Verified Charity
                                        </Badge>
                                      )}
                                    </div>
                                    {comment.user_id === currentUser?.id && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteComment(comment.id, update.id)}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                  <p className="text-sm text-foreground mt-1">{comment.content}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {formatTimeAgo(comment.created_at)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={newComment[update.id] || ""}
                            onChange={(e) =>
                              setNewComment((prev) => ({
                                ...prev,
                                [update.id]: e.target.value,
                              }))
                            }
                            className="min-h-[60px]"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleAddComment(update.id)}
                            disabled={!newComment[update.id]?.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block space-y-6 sticky top-6 self-start">
            {/* Trending Campaigns */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Trending Campaigns</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {trendingCampaigns.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No trending campaigns yet
                  </p>
                ) : (
                  trendingCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="group cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      {campaign.cover_image_path && (
                        <div className="rounded-lg overflow-hidden mb-2">
                          <img
                            src={`${API_URL}/storage/${campaign.cover_image_path}`}
                            alt={campaign.title}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      )}
                      <h4 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">
                        {campaign.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        {campaign.charity?.name}
                      </p>
                      <Progress
                        value={(campaign.current_amount / campaign.target_amount) * 100}
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{formatCurrency(campaign.current_amount)}</span>
                        <span>{formatCurrency(campaign.target_amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Suggested Charities */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Charities You Might Like</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestedCharities.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggestions available
                  </p>
                ) : (
                  suggestedCharities.map((charity) => (
                    <div
                      key={charity.id}
                      className="flex items-center gap-3 cursor-pointer group"
                      onClick={() => navigate(`/donor/charities/${charity.id}`)}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={
                            charity.logo_path
                              ? `${API_URL}/storage/${charity.logo_path}`
                              : undefined
                          }
                        />
                        <AvatarFallback>
                          {charity.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                          {charity.name}
                        </h4>
                        {charity.category && (
                          <p className="text-xs text-muted-foreground">{charity.category}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
