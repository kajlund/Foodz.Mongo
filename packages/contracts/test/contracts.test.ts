import { describe, expect, it } from 'vitest';
import { createRecipeSchema, recipeListQuerySchema } from '../src/index.js';
describe('recipe contracts', () => {
  it('applies safe recipe defaults', () => {
    const value = createRecipeSchema.parse({ userID: '665544332211009988776655', name: 'Soup' });
    expect(value).toMatchObject({
      rating: 0,
      tags: [],
      isPublic: true,
      ingredients: [],
      instructions: [],
    });
  });
  it('coerces and bounds pagination', () => {
    expect(recipeListQuerySchema.parse({ page: '2', limit: '25' })).toMatchObject({
      page: 2,
      limit: 25,
    });
    expect(() => recipeListQuerySchema.parse({ limit: '101' })).toThrow();
  });
});
