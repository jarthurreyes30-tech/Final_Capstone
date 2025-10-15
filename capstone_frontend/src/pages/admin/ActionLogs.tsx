import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Filter } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface AdminActionLog {
  id: number;
  admin: {
    id: number;
    name: string;
    email: string;
  };
  action_type: string;
  target_type?: string;
  target_id?: number;
  details?: any;
  notes?: string;
  ip_address?: string;
  created_at: string;
}

interface ActivityLog {
  id: number;
  user?: { id: number; name: string; email: string };
  user_id?: number;
  user_role?: string;
  action: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export default function AdminActionLogs() {
  // Admin action logs removed; only user activity remains

  // Activity logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityAction, setActivityAction] = useState("");
  const [activityUserId, setActivityUserId] = useState("");
  const [activityFrom, setActivityFrom] = useState("");
  const [activityTo, setActivityTo] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activityRole, setActivityRole] = useState<"" | "donor" | "charity_admin">("");

  const API_URL = import.meta.env.VITE_API_URL as string;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  // Ensure we always store arrays in state regardless of backend envelope shape
  const extractArray = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [] as any[];
  };

  useEffect(() => {
    fetchActivityLogs();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => {
        fetchActivityLogs(true);
      }, 10000);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [autoRefresh, activeTab]);

  // Admin action logs removed

  const fetchActivityLogs = async (silent = false) => {
    try {
      setActivityLoading(!silent);
      const params = new URLSearchParams();
      if (activityUserId) params.append('user_id', activityUserId);
      if (activityAction) params.append('action', activityAction);
      if (activityFrom) params.append('from_date', activityFrom);
      if (activityTo) params.append('to_date', activityTo);
      if (activityRole) params.append('role', activityRole);
      const token = getToken();
      const res = await axios.get(`${API_URL}/api/admin/security/activity-logs?${params.toString()}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setActivityLogs(extractArray(res.data));
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch activity logs', error);
        toast.error('Failed to fetch activity logs');
      }
      setActivityLogs([]);
    } finally {
      setActivityLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (actionTypeFilter !== "all") params.append("action_type", actionTypeFilter);
      if (targetTypeFilter !== "all") params.append("target_type", targetTypeFilter);
      if (startDate) params.append("start_date", startDate);
      if (endDate) params.append("end_date", endDate);

      const response = await axios.get(`/api/admin/action-logs/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin_logs_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Logs exported successfully");
    } catch (error) {
      toast.error("Failed to export logs");
    }
  };

  const formatActionType = (actionType: string) => {
    return actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionBadge = (actionType: string) => {
    const colors = {
      approve_charity: "bg-green-100 text-green-800",
      reject_charity: "bg-red-100 text-red-800",
      suspend_user: "bg-yellow-100 text-yellow-800",
      activate_user: "bg-blue-100 text-blue-800",
      review_report: "bg-purple-100 text-purple-800",
      delete_user: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800",
    };

    const color = colors[actionType as keyof typeof colors] || colors.other;
    
    return (
      <Badge className={color}>
        {formatActionType(actionType)}
      </Badge>
    );
  };

  // Only user activity remains; no loading gate for admin tab

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Activity</h1>
          <p className="text-muted-foreground">Live stream of donor and charity user actions</p>
        </div>
      </div>

      {/* User Activity Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" /> User Activity Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="User ID"
              value={activityUserId}
              onChange={(e) => setActivityUserId(e.target.value)}
            />
            <Input
              placeholder="Action (e.g., user_login, failed_login)"
              value={activityAction}
              onChange={(e) => setActivityAction(e.target.value)}
            />
            <Input type="date" value={activityFrom} onChange={(e)=>setActivityFrom(e.target.value)} />
            <Input type="date" value={activityTo} onChange={(e)=>setActivityTo(e.target.value)} />
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-2 text-sm"
                value={activityRole}
                onChange={(e) => setActivityRole(e.target.value as any)}
              >
                <option value="">All Roles</option>
                <option value="donor">Donors</option>
                <option value="charity_admin">Charity</option>
              </select>
              <Button onClick={() => fetchActivityLogs()}>Apply</Button>
              <Button variant="outline" onClick={() => { setActivityUserId(""); setActivityAction(""); setActivityFrom(""); setActivityTo(""); setActivityRole(""); fetchActivityLogs(); }}>Reset</Button>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <label className="text-sm flex items-center gap-2">
              <input type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} />
              Auto-refresh every 10s
            </label>
          </div>
        </CardContent>
      </Card>
      )}

      {/* User Activity List */}
      {activeTab==='activity' && (
      <Card>
        <CardHeader>
          <CardTitle>User Activity ({(activityLogs || []).length})</CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {(activityLogs || []).map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{log.action}</Badge>
                        {log.user && (
                          <span className="text-sm text-muted-foreground">by {log.user.name}</span>
                        )}
                      </div>
                      {log.details && (
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:underline">Details</summary>
                          <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">{JSON.stringify(log.details, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>{new Date(log.created_at).toLocaleString()}</p>
                      {log.ip_address && <p>IP: {log.ip_address}</p>}
                    </div>
                  </div>
                </div>
              ))}
              {(activityLogs || []).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">No user activity logs found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
