/**
 * Charity API Service
 *
 * Handles charity-related API calls including campaigns, fund usage, etc.
 */
import axios from 'axios';
import { campaignService } from './campaigns';
import { charityService } from './charity';
import type { DashboardData, DashboardActivityItem, DashboardDonationPoint } from '@/types/charity';

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  console.error('VITE_API_URL is not defined in your .env.local file');
}

// Types for charity operations
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface ListCampaignsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ListFundUsageParams {
  page?: number;
  pageSize?: number;
  category?: string;
}

// Campaign functions
export async function listCampaigns(params: ListCampaignsParams = {}): Promise<PaginatedResponse<any>> {
  // For now, return mock data since we need backend implementation
  // In a real implementation, this would call the charity campaigns API
  return {
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  };
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  // For now, this is a mock implementation
  // In a real implementation, this would call the delete campaign API
  console.log(`Deleting campaign ${campaignId}`);
}

// Fund usage functions
export async function listFundUsage(params: ListFundUsageParams = {}): Promise<{
  data: any[];
  pagination: PaginatedResponse<any>;
}> {
  // For now, return mock data since we need backend implementation
  return {
    data: [],
    pagination: {
      data: [],
      current_page: 1,
      last_page: 1,
      per_page: 20,
      total: 0,
    }
  };
}

export async function createFundUsage(data: FormData): Promise<void> {
  // For now, this is a mock implementation
  // In a real implementation, this would call the create fund usage API
  console.log('Creating fund usage entry:', data);
}

export { campaignService };

// Build dashboard from available charityService endpoints
export async function getDashboard(charityId: number): Promise<DashboardData> {
  // Fetch in parallel
  const [stats, recentDonations, recentPosts] = await Promise.all([
    charityService.getDashboardStats(charityId).catch(() => ({} as any)),
    charityService.getRecentDonations(charityId, 50).catch(() => []),
    charityService.getRecentPosts(charityId, 5).catch(() => []),
  ]);

  // KPIs with safe fallbacks
  const kpis = {
    totalDonations: Number(stats?.total_donations ?? stats?.totalDonations ?? 0),
    activeCampaigns: Number(stats?.active_campaigns ?? stats?.activeCampaigns ?? 0),
    pendingProofs: Number(stats?.pending_proofs ?? stats?.pendingProofs ?? 0),
    verifiedDocuments: Number(stats?.verified_documents ?? stats?.verifiedDocuments ?? 0),
  };

  // Donations over time: aggregate recent donations by date
  const agg: Record<string, number> = {};
  (Array.isArray(recentDonations) ? recentDonations : []).forEach((d: any) => {
    const date = new Date(d.created_at || d.donated_at || d.date || Date.now())
      .toISOString()
      .slice(0, 10);
    const amt = Number(d.amount ?? 0);
    agg[date] = (agg[date] || 0) + (isNaN(amt) ? 0 : amt);
  });
  const donationsOverTime: DashboardDonationPoint[] = Object.entries(agg)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, amount]) => ({ date, amount }));

  // Recent activity: donations + posts (most recent first)
  const donationActivities: DashboardActivityItem[] = (Array.isArray(recentDonations) ? recentDonations : []).slice(0, 10).map((d: any) => ({
    id: d.id,
    type: 'donation',
    description: `Donation received: ₱${Number(d.amount || 0).toLocaleString()}`,
    status: d.status || 'confirmed',
    timestamp: d.created_at || d.donated_at || new Date().toISOString(),
  }));
  const postActivities: DashboardActivityItem[] = (Array.isArray(recentPosts) ? recentPosts : []).slice(0, 10).map((p: any) => ({
    id: p.id,
    type: 'post',
    description: p.title || 'New update posted',
    status: 'info',
    timestamp: p.created_at || p.published_at || new Date().toISOString(),
  }));

  const recentActivities = [...donationActivities, ...postActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    stats: kpis,
    donationsOverTime,
    recentActivities,
  };
}
