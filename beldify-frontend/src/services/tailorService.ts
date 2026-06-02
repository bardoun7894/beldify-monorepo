import axios from 'axios';

import { API_BASE_URL } from '@/config/constants';

const API_URL = `${API_BASE_URL}/api`;

export interface TailorService {
  id: number;
  name: string;
  description: string | null;
  base_price: number | string;
  estimated_days: number;
  options?: Record<string, { price?: number }> | null;
}

export interface TailorReview {
  id: number;
  rating: number;
  review_text: string | null;
  created_at: string;
}

export interface Tailor {
  id: number;
  business_name: string;
  bio: string;
  specializations: string[];
  skills: string[];
  experience_years: number;
  profile_image: string;
  portfolio_images: string[];
  accepts_custom_orders: boolean;
  minimum_order_amount: number;
  lead_time_days: number;
  working_hours: Record<string, { start: string; end: string }>;
  rating: number;
  total_reviews: number;
  total_orders: number;
  completed_orders: number;
  is_verified: boolean;
  is_active: boolean;
  // Public, PII-safe owner display name (backend hides email/PII — bug 9).
  owner_name?: string | null;
  services?: TailorService[];
  reviews?: TailorReview[];
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface BookingRequest {
  service_id: number;
  date: string;
  time: string;
  notes?: string;
}

const tailorService = {
  async getTailors(params?: {
    location?: string;
    specialization?: string;
    rating?: number;
    page?: number;
  }) {
    try {
      const response = await axios.get(`${API_URL}/tailors`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getTailor(id: string | number) {
    try {
      const response = await axios.get(`${API_URL}/tailors/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async getTimeSlots(tailorId: string | number, date: string) {
    try {
      const response = await axios.get(`${API_URL}/tailors/${tailorId}/time-slots`, {
        params: { date },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  async createBooking(tailorId: string | number, bookingData: BookingRequest) {
    try {
      const response = await axios.post(`${API_URL}/tailors/${tailorId}/bookings`, bookingData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  handleError(error: any) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data.message || 'An error occurred';
      const errors = error.response.data.errors;
      return { message, errors };
    }

    if (error.request) {
      // Request made but no response
      return { message: 'Unable to connect to server' };
    }

    // Other errors
    return { message: 'An unexpected error occurred' };
  },
};

export default tailorService;
