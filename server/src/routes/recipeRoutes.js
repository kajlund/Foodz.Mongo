import express from 'express';
import {
  createRecipe,
  getRecipes,
  searchRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipeController.js';

const router = express.Router();

// Search route must be defined BEFORE /:id to prevent matching 'search' as an ID
router.get('/search', searchRecipes);

router.route('/')
  .post(createRecipe)
  .get(getRecipes);

router.route('/:id')
  .get(getRecipeById)
  .put(updateRecipe)
  .delete(deleteRecipe);

export default router;
