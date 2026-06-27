import recipeRepository from '../repositories/recipeRepository.js';
import mongoose from 'mongoose';
import { NotFoundError, BadRequestError } from '../errors.js';

/**
 * RecipeService executes domain business logic and orchestration.
 */
export class RecipeService {
  constructor(repository = recipeRepository) {
    this.repository = repository;
  }

  /**
   * Helper to validate Mongo ObjectId
   */
  validateObjectId(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Invalid ID format');
    }
  }

  /**
   * Domain helper to order ingredients and instructions by position
   */
  sortSubdocuments(data) {
    if (Array.isArray(data.ingredients)) {
      data.ingredients.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }
    if (Array.isArray(data.instructions)) {
      data.instructions.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }
  }

  /**
   * Create a new recipe applying ordering rules
   */
  async createRecipe(recipeData) {
    this.sortSubdocuments(recipeData);
    return await this.repository.create(recipeData);
  }

  /**
   * Get paginated and filtered recipes
   */
  async getRecipes({ userID, tag, isPublic, page = 1, limit = 10, sort = '-createdAt' }) {
    const query = {};

    if (userID) {
      this.validateObjectId(userID);
      query.userID = userID;
    }

    if (tag) {
      query.tags = tag;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await this.repository.count(query);
    const recipes = await this.repository.find(query, { sort, skip, limit: limitNum });

    return {
      recipes,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Search recipes by keyword across fields
   */
  async searchRecipes({ q, page = 1, limit = 10 }) {
    if (!q || q.trim() === '') {
      throw new BadRequestError('Search query parameter (q) is required');
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const searchQuery = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'ingredients.name': searchRegex },
        { by: searchRegex },
      ],
    };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await this.repository.count(searchQuery);
    const recipes = await this.repository.find(searchQuery, { sort: '-createdAt', skip, limit: limitNum });

    return {
      recipes,
      query: q,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Get recipe by ID
   */
  async getRecipeById(id) {
    this.validateObjectId(id);
    const recipe = await this.repository.findById(id);
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }
    return recipe;
  }

  /**
   * Update recipe by ID
   */
  async updateRecipe(id, updateData) {
    this.validateObjectId(id);
    this.sortSubdocuments(updateData);

    const recipe = await this.repository.update(id, updateData);
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }
    return recipe;
  }

  /**
   * Delete recipe by ID
   */
  async deleteRecipe(id) {
    this.validateObjectId(id);
    const recipe = await this.repository.delete(id);
    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }
    return recipe;
  }
}

export default new RecipeService();
