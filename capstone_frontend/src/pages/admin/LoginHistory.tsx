import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";

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

export default function LoginHistory() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<"" | "donor" | "charity_admin" | "admin">("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [userId, setUserId] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL as string;
  const getToken = () => localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

  const extractArray = (payload: any) => {
    if (Array.isArray(payload)) return payload;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    if (payload?.data?.data && Array.isArray(payload.data.data)) return payload.data.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [] as any[];
  };

  const fetchLogs = async (silent = false) => {
    try {
      setLoading(!silent);
      const params = new URLSearchParams();
      // We only want login/logout actions
      params.append('action', 'user_login');
      // Note: backend currently supports single 'action' filter.
      // We'll fetch login first then logout to combine client-side.
      if (userId) params.append('user_id', userId);
      if (role) params.append('role', role);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);

      const token = getToken();
      const loginRes = await axios.get(`${API_URL}/api/admin/security/activity-logs?${params.toString()}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      // Fetch logout entries
      const paramsLogout = new URLSearchParams(params);
      paramsLogout.set('action', 'user_logout');
      const logoutRes = await axios.get(`${API_URL}/api/admin/security/activity-logs?${paramsLogout.toString()}` , {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const combined = [...extractArray(loginRes.data), ...extractArray(logoutRes.data)]
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLogs(combined);
    } catch (e) {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let interval: number | undefined;
    if (autoRefresh) {
      interval = window.setInterval(() => fetchLogs(true), 10000);
    }
    return () => { if (interval) window.clearInterval(interval); };
  }, [autoRefresh, role, fromDate, toDate, userId]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Login History</h1>
        <p className="text-muted-foreground">Track login and logout events across donors, charity admins, and admins</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Role</label>
              <select className="w-full border rounded px-2 py-2 text-sm" value={role} onChange={(e)=>setRole(e.target.value as any)}>
                <option value="">All</option>
                <option value="donor">Donor</option>
                <option value="charity_admin">Charity Admin</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">User ID</label>
              <Input placeholder="e.g. 12" value={userId} onChange={(e)=>setUserId(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => fetchLogs()}>Apply</Button>
            </div>
            <div className="flex items-end">
              <label className="text-sm flex items-center gap-2">
                <input type="checkbox" checked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} />
                Auto-refresh
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Events ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-md p-3 flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.action === 'user_login' ? 'default' : 'secondary'}>
                        {log.action === 'user_login' ? 'LOGIN' : 'LOGOUT'}
                      </Badge>
                      {log.user && (
                        <span className="text-sm text-muted-foreground">{log.user.name} ({log.user.email})</span>
                      )}
                      {log.user_role && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">{log.user_role}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {log.ip_address && <span>IP: {log.ip_address} · </span>}
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">No login/logout events found.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
