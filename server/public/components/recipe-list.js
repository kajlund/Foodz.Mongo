import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm';

export class RecipeList extends LitElement {
  static properties = {
    recipes: { type: Array },
    loading: { type: Boolean },
    searchQuery: { type: String }
  };

  static styles = css`
    :host {
      display: block;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .search-box {
      flex: 1;
      min-width: 250px;
      position: relative;
    }

    .search-input {
      width: 100%;
      background: #1e293b;
      border: 1px solid #334155;
      color: #f8fafc;
      padding: 0.75rem 1rem;
      border-radius: 10px;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .search-input:focus {
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.2);
    }

    .btn-create {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
      color: #fff;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }

    .btn-create:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px -6px rgba(249, 115, 22, 0.5);
    }

    .recipe-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .recipe-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      transition: border-color 0.2s ease, transform 0.2s ease;
    }

    .recipe-card:hover {
      border-color: #f97316;
      transform: translateY(-3px);
    }

    .card-header {
      margin-bottom: 0.75rem;
    }

    .recipe-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      font-weight: 600;
      color: #f8fafc;
      margin-bottom: 0.25rem;
    }

    .recipe-author {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .recipe-desc {
      font-size: 0.9rem;
      color: #cbd5e1;
      margin-bottom: 1rem;
      line-clamp: 2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-bottom: 1rem;
    }

    .tag-badge {
      background: rgba(249, 115, 22, 0.15);
      color: #fb923c;
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.2rem 0.6rem;
      border-radius: 6px;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }

    .rating {
      color: #f59e0b;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .card-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn-action {
      background: #334155;
      color: #f8fafc;
      border: none;
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .btn-action:hover {
      background: #475569;
    }

    .btn-delete:hover {
      background: #ef4444;
      color: #fff;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      color: #94a3b8;
    }
  `;

  onSearchInput(e) {
    this.dispatchEvent(new CustomEvent('search-change', {
      detail: { query: e.target.value },
      bubbles: true,
      composed: true
    }));
  }

  onOpenCreate() {
    this.dispatchEvent(new CustomEvent('open-create', {
      bubbles: true,
      composed: true
    }));
  }

  renderStars(rating) {
    const stars = [];
    const r = Math.round(rating || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(i <= r ? '★' : '☆');
    }
    return stars.join('');
  }

  render() {
    return html`
      <div class="header-bar">
        <div class="search-box">
          <input
            type="text"
            class="search-input"
            placeholder="Search recipes, ingredients, tags..."
            .value="${this.searchQuery || ''}"
            @input="${this.onSearchInput}"
          />
        </div>
        <button class="btn-create" @click="${this.onOpenCreate}">
          <span>+ New Recipe</span>
        </button>
      </div>

      ${this.loading
        ? html`<div class="empty-state">Loading recipes...</div>`
        : this.recipes && this.recipes.length > 0
        ? html`
            <div class="recipe-grid">
              ${this.recipes.map(recipe => html`
                <div class="recipe-card">
                  <div>
                    <div class="card-header">
                      <div class="recipe-title">${recipe.name}</div>
                      ${recipe.by ? html`<div class="recipe-author">by ${recipe.by}</div>` : ''}
                    </div>
                    ${recipe.description ? html`<p class="recipe-desc">${recipe.description}</p>` : ''}
                    ${recipe.tags && recipe.tags.length > 0
                      ? html`
                          <div class="tag-list">
                            ${recipe.tags.map(tag => html`<span class="tag-badge">#${tag}</span>`)}
                          </div>
                        `
                      : ''}
                  </div>
                  <div class="card-footer">
                    <div class="rating">${this.renderStars(recipe.rating)} ${recipe.rating ? recipe.rating.toFixed(1) : '0.0'}</div>
                    <div class="card-actions">
                      <button class="btn-action" @click="${() => this.emit('view-recipe', recipe)}">View</button>
                      <button class="btn-action" @click="${() => this.emit('edit-recipe', recipe)}">Edit</button>
                      <button class="btn-action btn-delete" @click="${() => this.emit('delete-recipe', recipe._id)}">Delete</button>
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `
        : html`<div class="empty-state">No recipes found. Click "+ New Recipe" to add your first recipe!</div>`
      }
    `;
  }

  emit(eventName, detail) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('recipe-list', RecipeList);
