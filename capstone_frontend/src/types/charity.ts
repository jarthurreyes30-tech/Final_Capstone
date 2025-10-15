/**
 * Charity-related types and interfaces
 */

// Campaign types
export interface Campaign {
  id: string;
  title: string;
  description?: string;
  goal: number;
  raised: number;
  deadline: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  createdAt: string;
  updatedAt: string;
}

// Fund usage types
export interface FundUsageEntry {
  id: string;
  campaignId: string;
  campaignTitle?: string;
  amount: number;
  category: 'medical' | 'education' | 'food' | 'utilities' | 'other';
  description: string;
  date: string;
  receiptUrls: string[];
  createdAt: string;
  updatedAt: string;
}

// Charity profile types
export interface CharityProfile {
  id: string;
  name: string;
  description?: string;
  mission?: string;
  vision?: string;
  address?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  logoPath?: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Dashboard types
export interface DashboardKpiStats {
  totalDonations: number;
  activeCampaigns: number;
  pendingProofs: number;
  verifiedDocuments: number;
}

export interface DashboardDonationPoint {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface DashboardActivityItem {
  id: string | number;
  type: 'donation' | 'post' | 'system';
  description: string;
  status?: 'confirmed' | 'pending' | 'rejected' | 'info';
  timestamp: string; // ISO
}

export interface DashboardData {
  stats: DashboardKpiStats;
  donationsOverTime: DashboardDonationPoint[];
  recentActivities: DashboardActivityItem[];
}
