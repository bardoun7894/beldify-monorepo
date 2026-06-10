export interface User {
  id: number;
  user_type_id: number;
  full_name_en: string;
  full_name_ar: string;
  first_name?: string;
  last_name?: string;
  email: string;
  /** ISO timestamp when the email was verified; null / absent means unverified */
  email_verified_at?: string | null;
  contact_number: string;
  address_en: string | null;
  address_ar: string | null;
  username: string;
  image: string | null;
  avatar?: string; // Alternative to image, used in some components
  role?: string; // User role (e.g., 'admin', 'user', 'moderator')
  isActive: number;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  created_at: string;
  updated_at: string;
  preferences?: {
    id: number;
    user_id: number;
    email_notifications: boolean;
    marketing_emails: boolean;
    order_updates: boolean;
    newsletter: boolean;
    language: string;
    timezone: string;
  };
}

export interface AuthResponse {
  success: boolean;
  status?: string;
  user?: User;
  message?: string;
  data?: any;
}
