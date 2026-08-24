import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm';

export class RecipeDetail extends LitElement {
  static properties = {
    recipe: { type: Object }
  };

  static styles = css`
    :host {
      display: block;
    }

    .detail-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 2rem;
    }

    .nav-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .btn-back {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-back:hover {
      background: #475569;
    }

    .btn-edit {
      background: #f97316;
      color: #fff;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
    }

    .btn-edit:hover {
      background: #ea580c;
    }

    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 2rem;
      font-weight: 700;
      color: #f8fafc;
      margin-bottom: 0.5rem;
    }

    .meta {
      display: flex;
      gap: 1rem;
      align-items: center;
      color: #94a3b8;
      font-size: 0.9rem;
      margin-bottom: 1.5rem;
    }

    .rating {
      color: #f59e0b;
      font-weight: 600;
    }

    .description {
      color: #cbd5e1;
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
      background: rgba(15, 23, 42, 0.5);
      padding: 1rem;
      border-radius: 10px;
    }

    .section-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      color: #f97316;
      margin-bottom: 1rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 0.5rem;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    @media (max-width: 768px) {
      .grid-2 {
        grid-template-columns: 1fr;
      }
    }

    .ingredient-list {
      list-style: none;
    }

    .ingredient-item {
      display: flex;
      justify-content: space-between;
      padding: 0.6rem 0;
      border-bottom: 1px dashed #334155;
      color: #f1f5f9;
    }

    .amount {
      color: #fb923c;
      font-weight: 600;
    }

    .instruction-list {
      list-style: none;
      counter-reset: step-counter;
    }

    .instruction-item {
      counter-increment: step-counter;
      position: relative;
      padding-left: 2.5rem;
      margin-bottom: 1.25rem;
      color: #f1f5f9;
      line-height: 1.6;
    }

    .instruction-item::before {
      content: counter(step-counter);
      position: absolute;
      left: 0;
      top: 0;
      background: #f97316;
      color: #fff;
      width: 1.8rem;
      height: 1.8rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 700;
    }

    .tags-container {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 1.5rem;
    }

    .tag-badge {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .origin-link {
      margin-top: 1.5rem;
      font-size: 0.9rem;
    }
  `;

  render() {
    if (!this.recipe) return html`<div>No recipe selected</div>`;

    const { name, by, description, rating, tags, originUrl, ingredients, instructions } = this.recipe;

    return html`
      <div class="detail-card">
        <div class="nav-bar">
          <button class="btn-back" @click="${this.onBack}">← Back to Recipes</button>
          <button class="btn-edit" @click="${this.onEdit}">Edit Recipe</button>
        </div>

        <h1 class="title">${name}</h1>
        <div class="meta">
          ${by ? html`<span>By ${by}</span>` : ''}
          <span class="rating">★ ${rating ? rating.toFixed(1) : '0.0'}</span>
        </div>

        ${tags && tags.length > 0 ? html`
          <div class="tags-container">
            ${tags.map(tag => html`<span class="tag-badge">#${tag}</span>`)}
          </div>
        ` : ''}

        ${description ? html`<div class="description">${description}</div>` : ''}

        <div class="grid-2">
          <div>
            <h2 class="section-title">Ingredients</h2>
            ${ingredients && ingredients.length > 0 ? html`
              <ul class="ingredient-list">
                ${ingredients.map(ing => html`
                  <li class="ingredient-item">
                    <span>${ing.name}</span>
                    <span class="amount">${ing.amount || ''} ${ing.unit || ''}</span>
                  </li>
                `)}
              </ul>
            ` : html`<p style="color: #94a3b8;">No ingredients listed.</p>`}
          </div>

          <div>
            <h2 class="section-title">Instructions</h2>
            ${instructions && instructions.length > 0 ? html`
              <ol class="instruction-list">
                ${instructions.map(inst => html`
                  <li class="instruction-item">${inst.description}</li>
                `)}
              </ol>
            ` : html`<p style="color: #94a3b8;">No instructions listed.</p>`}
          </div>
        </div>

        ${originUrl ? html`
          <div class="origin-link">
            Original Recipe URL: <a href="${originUrl}" target="_blank" rel="noopener">${originUrl}</a>
          </div>
        ` : ''}
      </div>
    `;
  }

  onBack() {
    this.dispatchEvent(new CustomEvent('back', { bubbles: true, composed: true }));
  }

  onEdit() {
    this.dispatchEvent(new CustomEvent('edit-recipe', { detail: this.recipe, bubbles: true, composed: true }));
  }
}

customElements.define('recipe-detail', RecipeDetail);
