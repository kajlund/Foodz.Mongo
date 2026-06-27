import Recipe from '../models/Recipe.js';

/**
 * RecipeRepository handles direct database persistence operations with MongoDB / Mongoose.
 */
export class RecipeRepository {
  /**
   * Creates a new recipe document
   * @param {Object} recipeData
   * @returns {Promise<Object>}
   */
  async create(recipeData) {
    return await Recipe.create(recipeData);
  }

  /**
   * Finds recipes matching query conditions with pagination and sorting
   * @param {Object} query
   * @param {Object} options
   * @param {string} options.sort
   * @param {number} options.skip
   * @param {number} options.limit
   * @returns {Promise<Array>}
   */
  async find(query, { sort = '-createdAt', skip = 0, limit = 10 } = {}) {
    return await Recipe.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  /**
   * Counts total documents matching query conditions
   * @param {Object} query
   * @returns {Promise<number>}
   */
  async count(query) {
    return await Recipe.countDocuments(query);
  }

  /**
   * Finds a single recipe by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await Recipe.findById(id);
  }

  /**
   * Updates a recipe by ID
   * @param {string} id
   * @param {Object} updateData
   * @returns {Promise<Object|null>}
   */
  async update(id, updateData) {
    return await Recipe.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Deletes a recipe by ID
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async delete(id) {
    return await Recipe.findByIdAndDelete(id);
  }
}

export default new RecipeRepository();
