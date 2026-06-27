import Recipe from '../models/Recipe.js';
import mongoose from 'mongoose';

// Helper to validate Mongo ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Create a new recipe
 * @route   POST /api/recipes
 */
export const createRecipe = async (req, res, next) => {
  try {
    const recipeData = req.body;

    // Ensure ingredients & instructions are sorted by 'pos' if provided
    if (Array.isArray(recipeData.ingredients)) {
      recipeData.ingredients.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }
    if (Array.isArray(recipeData.instructions)) {
      recipeData.instructions.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }

    const recipe = await Recipe.create(recipeData);
    res.status(201).json({
      success: true,
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
    const { userID, tag, isPublic, page = 1, limit = 10, sort = '-createdAt' } = req.query;

    const query = {};

    if (userID) {
      if (!isValidObjectId(userID)) {
        return res.status(400).json({ success: false, error: 'Invalid userID format' });
      }
      query.userID = userID;
    }

    if (tag) {
      query.tags = tag;
    }

    if (isPublic !== undefined) {
      query.isPublic = isPublic === 'true';
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Recipe.countDocuments(query);
    const recipes = await Recipe.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: recipes.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: recipes,
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
    const { q, page = 1, limit = 10 } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({ success: false, error: 'Search query parameter (q) is required' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');

    // Search using regex match on key fields
    const searchQuery = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
        { 'ingredients.name': searchRegex },
        { by: searchRegex },
      ],
    };

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Recipe.countDocuments(searchQuery);
    const recipes = await Recipe.find(searchQuery)
      .sort('-createdAt')
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      query: q,
      count: recipes.length,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
      },
      data: recipes,
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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Recipe ID format' });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.status(200).json({
      success: true,
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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Recipe ID format' });
    }

    const updateData = req.body;

    if (Array.isArray(updateData.ingredients)) {
      updateData.ingredients.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }
    if (Array.isArray(updateData.instructions)) {
      updateData.instructions.sort((a, b) => (a.pos || 0) - (b.pos || 0));
    }

    const recipe = await Recipe.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.status(200).json({
      success: true,
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
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, error: 'Invalid Recipe ID format' });
    }

    const recipe = await Recipe.findByIdAndDelete(id);

    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Recipe successfully deleted',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
