# Foodz - Recipe REST API

A RESTful API built with **Node.js**, **Express**, and **Mongoose/MongoDB** for managing and searching recipes.

## Features

- **Full CRUD Operations**: Create, Read, Update, Delete recipes.
- **Ordered & Grouped Subdocuments**:
  - Ingredients grouped by part of dish (e.g. "Dough", "Sauce", or default "Ingredients") with order positions (`pos`).
  - Instructions grouped by phase with order positions (`pos`).
- **User Ownership & Visibility**: Recipes store `userID` and a public/private toggle (`isPublic`).
- **Automated Timestamps**: `createdAt` and `updatedAt` managed automatically by Mongoose.
- **Multi-Field Search**: Keyword search across name, description, tags, ingredient names, and author.

---

## Getting Started

### Prerequisites

- Node.js (v16+)
- MongoDB running locally (e.g. `mongodb://localhost:27017/foodz`) or a MongoDB Atlas connection URI.

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd ~/Developer/foodz/server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/foodz
   ```

4. Start the server:
   - **Development mode**: `npm run dev`
   - **Production mode**: `npm start`

---

## API Endpoints

### 1. Create a Recipe
`POST /api/recipes`

**Request Body**:
```json
{
  "userID": "667d4b2e8f123456789abcde",
  "name": "Homemade Margherita Pizza",
  "originUrl": "https://example.com/recipes/pizza",
  "by": "Chef Mario",
  "description": "Classic Neapolitan Margherita pizza with crispy crust.",
  "rating": 4.8,
  "tags": ["italian", "pizza", "vegetarian", "dinner"],
  "isPublic": true,
  "ingredients": [
    { "pos": 1, "group": "Dough", "name": "Bread Flour", "amount": 500, "unit": "g" },
    { "pos": 2, "group": "Dough", "name": "Warm Water", "amount": 325, "unit": "ml" },
    { "pos": 1, "group": "Toppings", "name": "San Marzano Tomatoes", "amount": 1, "unit": "can" },
    { "pos": 2, "group": "Toppings", "name": "Fresh Mozzarella", "amount": 200, "unit": "g" }
  ],
  "instructions": [
    { "pos": 1, "group": "Preparation", "description": "Mix flour, water, and yeast to make dough." },
    { "pos": 2, "group": "Baking", "description": "Bake in oven at 250°C for 10-12 minutes." }
  ]
}
```

### 2. List Recipes
`GET /api/recipes`

**Query Parameters**:
- `userID` (optional): Filter recipes by owner ID.
- `tag` (optional): Filter by specific tag.
- `isPublic` (optional): `true` or `false`.
- `page` (optional, default `1`): Page number.
- `limit` (optional, default `10`): Items per page.

### 3. Search Recipes
`GET /api/recipes/search?q=pizza`

Performs keyword search matching name, description, tags, or ingredient names.

### 4. Get Recipe by ID
`GET /api/recipes/:id`

### 5. Update Recipe
`PUT /api/recipes/:id`

### 6. Delete Recipe
`DELETE /api/recipes/:id`

---

## Example cURL Command

```bash
curl -X POST http://localhost:3000/api/recipes \
  -H "Content-Type: application/json" \
  -d '{
    "userID": "667d4b2e8f123456789abcde",
    "name": "Simple Garlic Bread",
    "description": "Quick and delicious garlic bread.",
    "ingredients": [
      { "pos": 1, "group": "Ingredients", "name": "Baguette", "amount": 1, "unit": "loaf" },
      { "pos": 2, "group": "Ingredients", "name": "Garlic Butter", "amount": 50, "unit": "g" }
    ],
    "instructions": [
      { "pos": 1, "group": "Instructions", "description": "Spread garlic butter on sliced baguette and toast." }
    ]
  }'
```
