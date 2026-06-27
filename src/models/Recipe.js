import mongoose from 'mongoose';

const IngredientSchema = new mongoose.Schema(
  {
    pos: {
      type: Number,
      required: [true, 'Ingredient position (pos) is required for ordering'],
    },
    group: {
      type: String,
      default: 'Ingredients',
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Ingredient name is required'],
      trim: true,
    },
    amount: {
      type: mongoose.Schema.Types.Mixed,
      default: '',
    },
    unit: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { _id: true }
);

const InstructionSchema = new mongoose.Schema(
  {
    pos: {
      type: Number,
      required: [true, 'Instruction position (pos) is required for ordering'],
    },
    group: {
      type: String,
      default: 'Instructions',
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Instruction description is required'],
      trim: true,
    },
  },
  { _id: true }
);

// Pre-validate hook to support legacy/alternative key 'Instructiongroup'
InstructionSchema.pre('validate', function (next) {
  if (this.Instructiongroup && !this.group) {
    this.group = this.Instructiongroup;
  }
  next();
});

const RecipeSchema = new mongoose.Schema(
  {
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Recipe name is required'],
      trim: true,
    },
    originUrl: {
      type: String,
      default: '',
      trim: true,
    },
    by: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },
    ingredients: {
      type: [IngredientSchema],
      default: [],
    },
    instructions: {
      type: [InstructionSchema],
      default: [],
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Create compound text index for keyword search across multiple fields
RecipeSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text',
  'ingredients.name': 'text',
});

const Recipe = mongoose.model('Recipe', RecipeSchema);

export default Recipe;
