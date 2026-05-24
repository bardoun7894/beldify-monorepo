import api from '@/lib/api';
import logger from '@/utils/consoleLogger';

export const authService = {
  async login(email: string, password: string) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      logger.error('Login Error:', error);
      throw error;
    }
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    try {
      const response = await api.post('/api/auth/register', userData);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      logger.error('Registration Error:', error);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/api/auth/logout');
      localStorage.removeItem('token');
    } catch (error: any) {
      logger.error('Logout Error:', error);
      // Still remove token even if API call fails
      localStorage.removeItem('token');
      throw error;
    }
  },

  async getUser() {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error: any) {
      logger.error('Get User Error:', error);
      throw error;
    }
  },

  // TODO: Backend does not expose API routes for password reset. Redirect to web flow: /{locale}/password/reset
  async forgotPassword(_email: string) {
    throw new Error('Password reset is not available via API. Use the web flow: /{locale}/password/reset');
  },

  // TODO: Backend does not expose API routes for password reset. Redirect to web flow: /{locale}/password/reset
  async resetPassword(_token: string, _password: string, _password_confirmation: string) {
    throw new Error('Password reset is not available via API. Use the web flow: /{locale}/password/reset');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
