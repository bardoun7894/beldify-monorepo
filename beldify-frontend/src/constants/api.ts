export { API_URL, API_BASE_URL } from '@/config/constants';
export const API_PREFIX = '/api';
export const API_VERSION = 'v1';
export const getApiPath = (path: string) => `${API_PREFIX}/${path}`.replace(/\/+/g, '/');
