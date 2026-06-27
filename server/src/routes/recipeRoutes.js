import express from 'express';
import {
  createRecipe,
  getRecipes,
  searchRecipes,
  getRecipeById,
  updateRecipe,
  deleteRecipe,
} from '../controllers/recipeController.js';
import { validate } from '../middleware/validate.js';
import {
  createRecipeValidator,
  updateRecipeValidator,
  getRecipesQueryValidator,
  searchRecipesQueryValidator,
} from '../validators/recipeValidator.js';

const router = express.Router();

// Search route must be defined BEFORE /:id to prevent matching 'search' as an ID
router.get('/search', validate(searchRecipesQueryValidator, 'query'), searchRecipes);

router.route('/')
  .post(validate(createRecipeValidator, 'body'), createRecipe)
  .get(validate(getRecipesQueryValidator, 'query'), getRecipes);

router.route('/:id')
  .get(getRecipeById)
  .put(validate(updateRecipeValidator, 'body'), updateRecipe)
  .delete(deleteRecipe);

export default router;
