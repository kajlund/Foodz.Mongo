import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../src/services/api-client.js';

describe('api client', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('fetches list of recipes with pagination query params', async () => {
    const mockData = [{ _id: '123', name: 'Pancakes' }];
    const mockPagination = { total: 25, page: 2, pages: 3 };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
        meta: { count: 1, pagination: mockPagination },
      }),
    } as unknown as Response);

    const result = await api.list({ page: 2, limit: 10 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes?page=2&limit=10',
      expect.anything(),
    );
    expect(result).toEqual({
      recipes: mockData,
      pagination: mockPagination,
    });
  });

  it('fetches search endpoint when query is provided', async () => {
    const mockData = [{ _id: '456', name: 'Garlic Bread' }];
    const mockPagination = { total: 1, page: 1, pages: 1 };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockData,
        meta: { count: 1, pagination: mockPagination },
      }),
    } as unknown as Response);

    const result = await api.list({ query: 'garlic', page: 1, limit: 25 });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=25&q=garlic',
      expect.anything(),
    );
    expect(result).toEqual({
      recipes: mockData,
      pagination: mockPagination,
    });
  });

  it('supports legacy string parameter for search query', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        meta: { count: 0, pagination: { total: 0, page: 1, pages: 1 } },
      }),
    } as unknown as Response);

    await api.list('soup');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/recipes/search?page=1&limit=10&q=soup',
      expect.anything(),
    );
  });
});
