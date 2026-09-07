import pino from 'pino';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.ts';

const logger = pino({ enabled: false });
const app = (overrides: Record<string, unknown> = {}) =>
  createApp(service(overrides), logger, undefined, false);
function service(overrides: Record<string, unknown> = {}) {
  return {
    getRecipes: vi
      .fn()
      .mockResolvedValue({ recipes: [], pagination: { total: 0, page: 1, pages: 1 } }),
    searchRecipes: vi
      .fn()
      .mockResolvedValue({ recipes: [], query: '', pagination: { total: 0, page: 1, pages: 1 } }),
    getCourses: vi.fn().mockResolvedValue(['Breakfast', 'Dessert', 'Dinner']),
    createRecipe: vi.fn(),
    getRecipeById: vi.fn(),
    updateRecipe: vi.fn(),
    deleteRecipe: vi.fn(),
    ...overrides,
  } as any;
}
describe('Mise API', () => {
  it('reports health', async () => {
    const response = await app().request('/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'OK' });
  });
  it('lists recipes with pagination metadata', async () => {
    const response = await app().request('/api/recipes');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, data: [], meta: { count: 0 } });
  });
  it('returns distinct courses from /api/recipes/courses', async () => {
    const getCourses = vi.fn().mockResolvedValue(['Breakfast', 'Dessert', 'Dinner']);
    const response = await app({ getCourses }).request('/api/recipes/courses');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: ['Breakfast', 'Dessert', 'Dinner'],
    });
    expect(getCourses).toHaveBeenCalled();
  });
  it('passes course query parameter to getRecipes', async () => {
    const getRecipes = vi
      .fn()
      .mockResolvedValue({ recipes: [], pagination: { total: 0, page: 1, pages: 1 } });
    const response = await app({ getRecipes }).request('/api/recipes?course=Dessert');
    expect(response.status).toBe(200);
    expect(getRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        course: 'Dessert',
      }),
    );
  });
  it('passes course query parameter to searchRecipes', async () => {
    const searchRecipes = vi.fn().mockResolvedValue({
      recipes: [],
      query: 'pie',
      pagination: { total: 0, page: 1, pages: 1 },
    });
    const response = await app({ searchRecipes }).request(
      '/api/recipes/search?q=pie&course=Dessert',
    );
    expect(response.status).toBe(200);
    expect(searchRecipes).toHaveBeenCalledWith(
      expect.objectContaining({
        q: 'pie',
        course: 'Dessert',
      }),
    );
  });
  it('rejects invalid create payloads', async () => {
    const response = await app().request('/api/recipes', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: { code: 'VALIDATION_ERROR' },
    });
  });
  it('rejects malformed ids', async () => {
    const response = await app().request('/api/recipes/nope');
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: 'INVALID_ID' } });
  });
});
