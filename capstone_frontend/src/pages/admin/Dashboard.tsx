import { useEffect, useState } from "react";
import { Users, Building2, CheckCircle, DollarSign, Activity, Eye, UserCheck, UserX, Clock, RefreshCw } from "lucide-react";
import { KPICard } from "@/components/admin/KPICard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

// Month labels helper
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

interface DashboardMetrics {
  total_users: number;
  total_donors: number;
  total_charity_admins: number;
  charities: number;
  pending_verifications: number;
  campaigns: number;
  donations: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface Charity {
  id: number;
  name: string;
  contact_email: string;
  verification_status: string;
  created_at: string;
  owner?: {
    name: string;
  };
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [pendingCharities, setPendingCharities] = useState<Charity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [donationsTrend, setDonationsTrend] = useState<Array<{ month: string; amount: number }>>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch metrics
      const metricsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/metrics`);
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      // Fetch recent users
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const usersResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        // Handle both array responses and Laravel paginator objects
        const usersArray = Array.isArray(usersData)
          ? usersData
          : Array.isArray(usersData?.data)
            ? usersData.data
            : [];
        setRecentUsers(usersArray.slice(0, 5)); // Show latest 5 users
      }

      // Fetch pending charities
      const charitiesResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/charities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (charitiesResponse.ok) {
        const charitiesData = await charitiesResponse.json();
        // Handle both array responses and Laravel paginator objects
        const charitiesArray = Array.isArray(charitiesData)
          ? charitiesData
          : Array.isArray(charitiesData?.data)
            ? charitiesData.data
            : [];
        const pending = charitiesArray.filter((c: Charity) => c.verification_status === 'pending');
        setPendingCharities(pending.slice(0, 5)); // Show latest 5 pending
      }

      // Fetch donations trend (public endpoint)
      const statsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard/stats`);
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        const trends = Array.isArray(statsData?.monthly_trends) ? statsData.monthly_trends : [];
        // trends items: { year, month, total_amount, donation_count }
        const formatted = trends
          .slice()
          .sort((a: any, b: any) => a.year === b.year ? a.month - b.month : a.year - b.year)
          .map((t: any) => ({ month: MONTHS[(t.month - 1) % 12], amount: Number(t.total_amount) || 0 }));
        setDonationsTrend(formatted);
      } else {
        setDonationsTrend([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
      // Set fallback empty arrays to prevent undefined errors
      setMetrics(null);
      setRecentUsers([]);
      setPendingCharities([]);
      setDonationsTrend([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCharityAction = async (charityId: number, action: 'approve' | 'reject') => {
    setActionLoading(`${action}-${charityId}`);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/charities/${charityId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to ${action} charity`);
      
      toast.success(`Charity ${action}d successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to ${action} charity`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUserAction = async (userId: number, action: 'suspend' | 'activate') => {
    setActionLoading(`${action}-${userId}`);
    try {
      // Check both localStorage and sessionStorage for token
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Failed to ${action} user`);
      
      toast.success(`User ${action}d successfully`);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      toast.error(`Failed to ${action} user`);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Admin Dashboard</h1>
          <a href="/admin/reports" className="text-muted-foreground mt-2 inline-block hover:text-primary transition-colors">
            Overview of your charity platform
          </a>
        </div>
        <Button onClick={fetchDashboardData} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KPICard
          title="Total Users"
          value={metrics?.total_users?.toString() || '0'}
          icon={Users}
          description="All registered users"
          to="/admin/users"
        />
        <KPICard
          title="Total Donors"
          value={metrics?.total_donors?.toString() || '0'}
          icon={DollarSign}
          description="Registered donors"
          to="/admin/users"
        />
        <KPICard
          title="Charity Admins"
          value={metrics?.total_charity_admins?.toString() || '0'}
          icon={Building2}
          description="Charity representatives"
          to="/admin/users"
        />
        <KPICard
          title="Approved Charities"
          value={metrics?.charities?.toString() || '0'}
          icon={CheckCircle}
          description="Verified organizations"
          to="/admin/charities"
        />
        <KPICard
          title="Pending Verifications"
          value={metrics?.pending_verifications?.toString() || '0'}
          icon={Activity}
          description="Awaiting review"
          to="/admin/charities"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Pending Charities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Charity Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingCharities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending verifications</p>
            ) : (
              <div className="space-y-4">
                {(pendingCharities || []).map((charity) => (
                  <div key={charity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{charity.name}</h4>
                      <p className="text-sm text-muted-foreground">{charity.contact_email}</p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {new Date(charity.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCharityAction(charity.id, 'approve')}
                        disabled={actionLoading === `approve-${charity.id}`}
                      >
                        {actionLoading === `approve-${charity.id}` ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCharityAction(charity.id, 'reject')}
                        disabled={actionLoading === `reject-${charity.id}`}
                      >
                        {actionLoading === `reject-${charity.id}` ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <UserX className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent User Registrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No recent users</p>
            ) : (
              <div className="space-y-4">
                {(recentUsers || []).map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={user.role === 'donor' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>
                          {user.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {user.status === 'active' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'suspend')}
                          disabled={actionLoading === `suspend-${user.id}`}
                        >
                          {actionLoading === `suspend-${user.id}` ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserX className="h-3 w-3" />
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleUserAction(user.id, 'activate')}
                          disabled={actionLoading === `activate-${user.id}`}
                        >
                          {actionLoading === `activate-${user.id}` ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <UserCheck className="h-3 w-3" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Donations Received</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={donationsTrend}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                className="text-xs"
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
