import vine from '@vinejs/vine';

// Ingredient validation sub-schema
const ingredientSchema = vine.object({
  pos: vine.number().min(1),
  group: vine.string().trim().optional(),
  name: vine.string().trim().minLength(1),
  amount: vine.any().optional(),
  unit: vine.string().trim().optional(),
});

// Instruction validation sub-schema
const instructionSchema = vine.object({
  pos: vine.number().min(1),
  group: vine.string().trim().optional(),
  description: vine.string().trim().minLength(1),
});

/**
 * Schema for creating a new Recipe
 */
export const createRecipeSchema = vine.object({
  userID: vine.string().trim().minLength(1),
  name: vine.string().trim().minLength(1),
  originUrl: vine.string().trim().optional(),
  by: vine.string().trim().optional(),
  description: vine.string().trim().optional(),
  rating: vine.number().min(0).max(5).optional(),
  tags: vine.array(vine.string().trim()).optional(),
  isPublic: vine.boolean().optional(),
  ingredients: vine.array(ingredientSchema).optional(),
  instructions: vine.array(instructionSchema).optional(),
});

/**
 * Schema for updating an existing Recipe
 */
export const updateRecipeSchema = vine.object({
  userID: vine.string().trim().optional(),
  name: vine.string().trim().minLength(1).optional(),
  originUrl: vine.string().trim().optional(),
  by: vine.string().trim().optional(),
  description: vine.string().trim().optional(),
  rating: vine.number().min(0).max(5).optional(),
  tags: vine.array(vine.string().trim()).optional(),
  isPublic: vine.boolean().optional(),
  ingredients: vine.array(ingredientSchema).optional(),
  instructions: vine.array(instructionSchema).optional(),
});

/**
 * Schema for querying recipes list
 */
export const getRecipesQuerySchema = vine.object({
  userID: vine.string().trim().optional(),
  tag: vine.string().trim().optional(),
  isPublic: vine.string().optional(),
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
  sort: vine.string().trim().optional(),
});

/**
 * Schema for keyword search query
 */
export const searchRecipesQuerySchema = vine.object({
  q: vine.string().trim().minLength(1),
  page: vine.number().min(1).optional(),
  limit: vine.number().min(1).max(100).optional(),
});

// Compiled validators for maximum performance
export const createRecipeValidator = vine.compile(createRecipeSchema);
export const updateRecipeValidator = vine.compile(updateRecipeSchema);
export const getRecipesQueryValidator = vine.compile(getRecipesQuerySchema);
export const searchRecipesQueryValidator = vine.compile(searchRecipesQuerySchema);
