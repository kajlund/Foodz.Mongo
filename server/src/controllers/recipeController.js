import recipeService from '../services/recipeService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * RecipeController handles HTTP Request/Response translation layer.
 */

/**
 * @desc    Create a new recipe
 * @route   POST /api/recipes
 */
export const createRecipe = async (req, res, next) => {
  try {
    const recipe = await recipeService.createRecipe(req.body);
    return sendSuccess(res, {
      statusCode: 201,
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all recipes with filtering & pagination
 * @route   GET /api/recipes
 */
export const getRecipes = async (req, res, next) => {
  try {
    const result = await recipeService.getRecipes(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      data: result.recipes,
      meta: {
        count: result.recipes.length,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search recipes by keyword
 * @route   GET /api/recipes/search
 */
export const searchRecipes = async (req, res, next) => {
  try {
    const result = await recipeService.searchRecipes(req.query);
    return sendSuccess(res, {
      statusCode: 200,
      data: result.recipes,
      meta: {
        query: result.query,
        count: result.recipes.length,
        pagination: result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single recipe by ID
 * @route   GET /api/recipes/:id
 */
export const getRecipeById = async (req, res, next) => {
  try {
    const recipe = await recipeService.getRecipeById(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a recipe
 * @route   PUT /api/recipes/:id
 */
export const updateRecipe = async (req, res, next) => {
  try {
    const recipe = await recipeService.updateRecipe(req.params.id, req.body);
    return sendSuccess(res, {
      statusCode: 200,
      data: recipe,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a recipe
 * @route   DELETE /api/recipes/:id
 */
export const deleteRecipe = async (req, res, next) => {
  try {
    await recipeService.deleteRecipe(req.params.id);
    return sendSuccess(res, {
      statusCode: 200,
      message: 'Recipe successfully deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
