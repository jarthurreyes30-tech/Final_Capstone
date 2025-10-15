/**
 * Charity Service
 * 
 * Handles charity-specific API calls including donation channels
 */
import axios, { AxiosInstance } from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

class CharityService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Get all donation channels for a charity (owner/donor access)
  async getDonationChannels(charityId: number) {
    try {
      // Prefer owner-manage endpoint (requires charity_admin + owner)
      const res = await this.api.get(`/api/charities/${charityId}/channels/manage`);
      return res.data;
    } catch (e: any) {
      // Fallback to public/donor-visible endpoint if manage is forbidden
      if (e?.response?.status === 403) {
        const res2 = await this.api.get(`/api/charities/${charityId}/channels`);
        return res2.data;
      }
      throw e;
    }
  }

  // Create a new donation channel for a charity
  async createDonationChannel(
    charityId: number,
    payload: {
      type: 'gcash' | 'paymaya' | 'paypal' | 'bank' | 'other';
      label: string;
      details?: Record<string, any>;
      qr_image?: File | null;
      is_active?: boolean;
    }
  ) {
    const fd = new FormData();
    fd.append('type', payload.type);
    fd.append('label', payload.label);
    if (payload.is_active !== undefined) fd.append('is_active', String(payload.is_active));

    if (payload.details) {
      Object.entries(payload.details).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          fd.append(`details[${k}]`, String(v));
        }
      });
    }

    if (payload.qr_image) {
      fd.append('qr_image', payload.qr_image);
    }

    const res = await this.api.post(`/api/charities/${charityId}/channels`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Update an existing donation channel (owner)
  async updateDonationChannel(
    charityId: number,
    channelId: number,
    payload: {
      type?: 'gcash' | 'paymaya' | 'paypal' | 'bank' | 'other';
      label?: string;
      details?: Record<string, any>;
      qr_image?: File | null;
      is_active?: boolean;
    }
  ) {
    const fd = new FormData();
    if (payload.type) fd.append('type', payload.type);
    if (payload.label) fd.append('label', payload.label);
    if (payload.is_active !== undefined) fd.append('is_active', String(payload.is_active));
    if (payload.details) {
      Object.entries(payload.details).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          fd.append(`details[${k}]`, String(v));
        }
      });
    }
    if (payload.qr_image) fd.append('qr_image', payload.qr_image);

    const res = await this.api.post(`/api/charities/${charityId}/channels/${channelId}?_method=PUT`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // Delete a donation channel (owner)
  async deleteDonationChannel(charityId: number, channelId: number) {
    const res = await this.api.delete(`/api/charities/${charityId}/channels/${channelId}`);
    return res.data;
  }

  // Get charity dashboard stats
  async getDashboardStats(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/dashboard-stats`);
    return res.data;
  }

  // Get recent donations for charity
  async getRecentDonations(charityId: number, limit: number = 5) {
    const res = await this.api.get(`/charities/${charityId}/donations`, {
      params: { limit, status: 'confirmed' }
    });
    return res.data;
  }

  // Get recent posts for charity
  async getRecentPosts(charityId: number, limit: number = 1) {
    const res = await this.api.get(`/charities/${charityId}/posts`, {
      params: { limit }
    });
    return res.data;
  }

  // Get active campaigns count
  async getActiveCampaigns(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/campaigns`, {
      params: { status: 'active' }
    });
    return res.data;
  }

  // Get pending donations count
  async getPendingDonationsCount(charityId: number) {
    const res = await this.api.get(`/charities/${charityId}/donations`, {
      params: { status: 'pending' }
    });
    return res.data;
  }

  // Get public charity profile
  async getPublicCharityProfile(charityId: number) {
    const res = await this.api.get(`/api/charities/${charityId}`);
    return res.data;
  }

  // Get charity campaigns (public)
  async getCharityCampaigns(charityId: number, params?: { status?: string; page?: number }) {
    const res = await this.api.get(`/api/charities/${charityId}/campaigns`, { params });
    return res.data;
  }

  // Follow/unfollow charity
  async toggleFollow(charityId: number) {
    const res = await this.api.post(`/api/charities/${charityId}/follow`);
    return res.data;
  }

  // Check if user follows charity
  async checkFollowStatus(charityId: number) {
    const res = await this.api.get(`/api/charities/${charityId}/follow-status`);
    return res.data;
  }

  // Get charity stats (public)
  async getCharityStats(charityId: number) {
    const res = await this.api.get(`/api/charities/${charityId}/stats`);
    return res.data;
  }
}

// Export a single instance
export const charityService = new CharityService();
