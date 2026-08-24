import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm';

export class RecipeForm extends LitElement {
  static properties = {
    recipe: { type: Object },
    isEdit: { type: Boolean },
    formData: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
    }

    .form-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2rem;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 1rem;
    }

    .form-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: #f8fafc;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      font-weight: 600;
      font-size: 0.9rem;
      color: #cbd5e1;
      margin-bottom: 0.4rem;
    }

    input[type="text"],
    input[type="number"],
    textarea {
      width: 100%;
      background: #0f172a;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }

    input:focus, textarea:focus {
      border-color: #f97316;
    }

    .row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .dynamic-section {
      margin-top: 2rem;
      margin-bottom: 2rem;
    }

    .section-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.2rem;
      color: #f97316;
    }

    .dynamic-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .btn-add {
      background: rgba(249, 115, 22, 0.2);
      color: #fb923c;
      border: 1px dashed #f97316;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-add:hover {
      background: rgba(249, 115, 22, 0.3);
    }

    .btn-remove {
      background: #334155;
      color: #ef4444;
      border: none;
      width: 2.2rem;
      height: 2.2rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: bold;
    }

    .btn-remove:hover {
      background: #ef4444;
      color: #fff;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #334155;
    }

    .btn-cancel {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-submit {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      border: none;
      padding: 0.75rem 1.75rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.formData = {
      name: '',
      by: '',
      description: '',
      rating: 0,
      tags: '',
      originUrl: '',
      ingredients: [{ pos: 1, name: '', amount: '', unit: '' }],
      instructions: [{ pos: 1, description: '' }]
    };
  }

  willUpdate(changedProperties) {
    if (changedProperties.has('recipe') && this.recipe) {
      this.formData = {
        name: this.recipe.name || '',
        by: this.recipe.by || '',
        description: this.recipe.description || '',
        rating: this.recipe.rating || 0,
        tags: Array.isArray(this.recipe.tags) ? this.recipe.tags.join(', ') : '',
        originUrl: this.recipe.originUrl || '',
        ingredients: (this.recipe.ingredients && this.recipe.ingredients.length > 0)
          ? this.recipe.ingredients.map((ing, idx) => ({ ...ing, pos: idx + 1 }))
          : [{ pos: 1, name: '', amount: '', unit: '' }],
        instructions: (this.recipe.instructions && this.recipe.instructions.length > 0)
          ? this.recipe.instructions.map((inst, idx) => ({ ...inst, pos: idx + 1 }))
          : [{ pos: 1, description: '' }]
      };
    }
  }

  onFieldInput(field, value) {
    this.formData = { ...this.formData, [field]: value };
    this.requestUpdate();
  }

  onIngredientInput(idx, field, value) {
    const ingredients = [...this.formData.ingredients];
    ingredients[idx] = { ...ingredients[idx], [field]: value };
    this.formData = { ...this.formData, ingredients };
    this.requestUpdate();
  }

  addIngredient() {
    const ingredients = [
      ...this.formData.ingredients,
      { pos: this.formData.ingredients.length + 1, name: '', amount: '', unit: '' }
    ];
    this.formData = { ...this.formData, ingredients };
    this.requestUpdate();
  }

  removeIngredient(idx) {
    const ingredients = this.formData.ingredients.filter((_, i) => i !== idx);
    this.formData = { ...this.formData, ingredients };
    this.requestUpdate();
  }

  onInstructionInput(idx, value) {
    const instructions = [...this.formData.instructions];
    instructions[idx] = { ...instructions[idx], description: value };
    this.formData = { ...this.formData, instructions };
    this.requestUpdate();
  }

  addInstruction() {
    const instructions = [
      ...this.formData.instructions,
      { pos: this.formData.instructions.length + 1, description: '' }
    ];
    this.formData = { ...this.formData, instructions };
    this.requestUpdate();
  }

  removeInstruction(idx) {
    const instructions = this.formData.instructions.filter((_, i) => i !== idx);
    this.formData = { ...this.formData, instructions };
    this.requestUpdate();
  }

  handleSubmit(e) {
    e.preventDefault();

    // Clean payload
    const tagsArray = this.formData.tags
      ? this.formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const cleanIngredients = this.formData.ingredients
      .filter(i => i.name.trim() !== '')
      .map((ing, idx) => ({
        pos: idx + 1,
        group: 'Ingredients',
        name: ing.name.trim(),
        amount: ing.amount ? ing.amount : '',
        unit: ing.unit ? ing.unit.trim() : ''
      }));

    const cleanInstructions = this.formData.instructions
      .filter(i => i.description.trim() !== '')
      .map((inst, idx) => ({
        pos: idx + 1,
        group: 'Instructions',
        description: inst.description.trim()
      }));

    const payload = {
      userID: this.recipe?.userID || '665544332211009988776655', // Standard valid Mongo ObjectId for default user
      name: this.formData.name.trim(),
      by: this.formData.by.trim(),
      description: this.formData.description.trim(),
      rating: Number(this.formData.rating) || 0,
      originUrl: this.formData.originUrl.trim(),
      tags: tagsArray,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      isPublic: true
    };

    this.dispatchEvent(new CustomEvent('save-recipe', {
      detail: { payload, id: this.recipe?._id },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="form-card">
        <div class="form-header">
          <h2 class="form-title">${this.isEdit ? 'Edit Recipe' : 'Create New Recipe'}</h2>
        </div>

        <form @submit="${this.handleSubmit}">
          <div class="form-group">
            <label>Recipe Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Garlic Butter Cream Pasta"
              .value="${this.formData.name}"
              @input="${e => this.onFieldInput('name', e.target.value)}"
            />
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>Author / By</label>
              <input
                type="text"
                placeholder="e.g. Chef Luigi"
                .value="${this.formData.by}"
                @input="${e => this.onFieldInput('by', e.target.value)}"
              />
            </div>
            <div class="form-group">
              <label>Rating (0 to 5)</label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.5"
                .value="${this.formData.rating}"
                @input="${e => this.onFieldInput('rating', e.target.value)}"
              />
            </div>
          </div>

          <div class="form-group">
            <label>Description</label>
            <textarea
              rows="3"
              placeholder="Short overview of the dish..."
              .value="${this.formData.description}"
              @input="${e => this.onFieldInput('description', e.target.value)}"
            ></textarea>
          </div>

          <div class="row-2">
            <div class="form-group">
              <label>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="pasta, quick, Italian"
                .value="${this.formData.tags}"
                @input="${e => this.onFieldInput('tags', e.target.value)}"
              />
            </div>
            <div class="form-group">
              <label>Origin URL</label>
              <input
                type="text"
                placeholder="https://..."
                .value="${this.formData.originUrl}"
                @input="${e => this.onFieldInput('originUrl', e.target.value)}"
              />
            </div>
          </div>

          <!-- Dynamic Ingredients -->
          <div class="dynamic-section">
            <div class="section-head">
              <span class="section-title">Ingredients</span>
              <button type="button" class="btn-add" @click="${this.addIngredient}">+ Add Ingredient</button>
            </div>
            ${this.formData.ingredients.map((ing, idx) => html`
              <div class="dynamic-row">
                <input
                  type="text"
                  placeholder="Name (e.g. Spaghetti)"
                  style="flex: 2;"
                  .value="${ing.name || ''}"
                  @input="${e => this.onIngredientInput(idx, 'name', e.target.value)}"
                />
                <input
                  type="text"
                  placeholder="Amount (e.g. 200)"
                  style="flex: 1;"
                  .value="${ing.amount || ''}"
                  @input="${e => this.onIngredientInput(idx, 'amount', e.target.value)}"
                />
                <input
                  type="text"
                  placeholder="Unit (e.g. g)"
                  style="flex: 1;"
                  .value="${ing.unit || ''}"
                  @input="${e => this.onIngredientInput(idx, 'unit', e.target.value)}"
                />
                ${this.formData.ingredients.length > 1 ? html`
                  <button type="button" class="btn-remove" @click="${() => this.removeIngredient(idx)}">✕</button>
                ` : ''}
              </div>
            `)}
          </div>

          <!-- Dynamic Instructions -->
          <div class="dynamic-section">
            <div class="section-head">
              <span class="section-title">Instructions / Steps</span>
              <button type="button" class="btn-add" @click="${this.addInstruction}">+ Add Step</button>
            </div>
            ${this.formData.instructions.map((inst, idx) => html`
              <div class="dynamic-row">
                <span style="color: #94a3b8; font-weight: bold; width: 1.5rem;">${idx + 1}.</span>
                <input
                  type="text"
                  placeholder="Describe step..."
                  style="flex: 1;"
                  .value="${inst.description || ''}"
                  @input="${e => this.onInstructionInput(idx, e.target.value)}"
                />
                ${this.formData.instructions.length > 1 ? html`
                  <button type="button" class="btn-remove" @click="${() => this.removeInstruction(idx)}">✕</button>
                ` : ''}
              </div>
            `)}
          </div>

          <div class="form-actions">
            <button type="button" class="btn-cancel" @click="${this.onCancel}">Cancel</button>
            <button type="submit" class="btn-submit">${this.isEdit ? 'Save Changes' : 'Create Recipe'}</button>
          </div>
        </form>
      </div>
    `;
  }

  onCancel() {
    this.dispatchEvent(new CustomEvent('cancel', { bubbles: true, composed: true }));
  }
}

customElements.define('recipe-form', RecipeForm);
