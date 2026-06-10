/**
 * TDD — RED phase
 * Tests for addressService — full CRUD + set-default.
 * Written BEFORE the implementation file exists.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/utils/consoleLogger', () => ({
  default: {
    log: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import api from '@/lib/api';
import { addressService, SavedAddress } from '../addressService';

const mockGet = api.get as ReturnType<typeof vi.fn>;
const mockPost = api.post as ReturnType<typeof vi.fn>;
const mockPut = api.put as ReturnType<typeof vi.fn>;
const mockDelete = api.delete as ReturnType<typeof vi.fn>;

const sampleAddress: SavedAddress = {
  id: 1,
  label: 'Home',
  first_name: 'Hassan',
  last_name: 'Benali',
  email: 'hassan@example.com',
  phone: '0612345678',
  address: '1 Rue de Fez',
  apartment: '',
  city: 'Casablanca',
  state: 'Casablanca',
  postal_code: '20000',
  country: 'MA',
  is_default: true,
};

describe('addressService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('list', () => {
    it('is a function', () => {
      expect(typeof addressService.list).toBe('function');
    });

    it('GETs /api/user/addresses and returns addresses array', async () => {
      mockGet.mockResolvedValueOnce({
        data: { success: true, data: { addresses: [sampleAddress] } },
      });

      const result = await addressService.list();

      expect(mockGet).toHaveBeenCalledWith('/api/user/addresses');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it('returns empty array when API fails', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network Error'));

      const result = await addressService.list();

      expect(result).toEqual([]);
    });

    it('returns empty array when success=false', async () => {
      mockGet.mockResolvedValueOnce({ data: { success: false } });

      const result = await addressService.list();

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('is a function', () => {
      expect(typeof addressService.create).toBe('function');
    });

    it('POSTs to /api/user/addresses and returns the created address', async () => {
      mockPost.mockResolvedValueOnce({
        data: { success: true, data: { address: sampleAddress } },
      });

      const payload = {
        first_name: 'Hassan',
        last_name: 'Benali',
        email: 'hassan@example.com',
        phone: '0612345678',
        address: '1 Rue de Fez',
        city: 'Casablanca',
        state: 'Casablanca',
        country: 'MA',
      };
      const result = await addressService.create(payload);

      expect(mockPost).toHaveBeenCalledWith('/api/user/addresses', payload);
      expect(result.id).toBe(1);
    });

    it('throws on failure (caller handles toast)', async () => {
      mockPost.mockRejectedValueOnce(new Error('Validation error'));

      await expect(addressService.create({})).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('is a function', () => {
      expect(typeof addressService.update).toBe('function');
    });

    it('PUTs to /api/user/addresses/{id}', async () => {
      mockPut.mockResolvedValueOnce({
        data: { success: true, data: { address: { ...sampleAddress, label: 'Work' } } },
      });

      const result = await addressService.update(1, { label: 'Work' });

      expect(mockPut).toHaveBeenCalledWith('/api/user/addresses/1', { label: 'Work' });
      expect(result.label).toBe('Work');
    });
  });

  describe('remove', () => {
    it('is a function', () => {
      expect(typeof addressService.remove).toBe('function');
    });

    it('DELETEs /api/user/addresses/{id}', async () => {
      mockDelete.mockResolvedValueOnce({ data: { success: true } });

      await addressService.remove(1);

      expect(mockDelete).toHaveBeenCalledWith('/api/user/addresses/1');
    });

    it('throws on failure', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Not found'));

      await expect(addressService.remove(999)).rejects.toThrow();
    });
  });

  describe('setDefault', () => {
    it('is a function', () => {
      expect(typeof addressService.setDefault).toBe('function');
    });

    it('POSTs to /api/user/addresses/{id}/default', async () => {
      mockPost.mockResolvedValueOnce({ data: { success: true } });

      await addressService.setDefault(1);

      expect(mockPost).toHaveBeenCalledWith('/api/user/addresses/1/default');
    });

    it('throws on failure', async () => {
      mockPost.mockRejectedValueOnce(new Error('Forbidden'));

      await expect(addressService.setDefault(99)).rejects.toThrow();
    });
  });

  describe('prefillFromAddress', () => {
    it('is a function', () => {
      expect(typeof addressService.prefillFromAddress).toBe('function');
    });

    it('maps a SavedAddress to the ShippingInfo shape', () => {
      const result = addressService.prefillFromAddress(sampleAddress);

      expect(result).toMatchObject({
        firstName: 'Hassan',
        lastName: 'Benali',
        email: 'hassan@example.com',
        phone: '0612345678',
        address: '1 Rue de Fez',
        city: 'Casablanca',
        state: 'Casablanca',
        country: 'MA',
      });
    });
  });
});
