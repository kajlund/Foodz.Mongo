import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.1.2/+esm';
import './recipe-list.js';
import './recipe-detail.js';
import './recipe-form.js';

export class FoodzApp extends LitElement {
  static properties = {
    currentView: { type: String }, // 'list' | 'detail' | 'form'
    recipes: { type: Array },
    selectedRecipe: { type: Object },
    loading: { type: Boolean },
    searchQuery: { type: String },
    notification: { type: Object } // { message, type: 'success' | 'error' }
  };

  static styles = css`
    :host {
      display: block;
      max-width: 1040px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem 4rem 1.5rem;
      width: 100%;
    }

    * {
      box-sizing: border-box;
    }

    .app-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 1.5rem;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
    }

    .brand-icon {
      font-size: 2rem;
      background: linear-gradient(135deg, #f97316 0%, #f59e0b 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .brand-title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      color: #f8fafc;
      letter-spacing: -0.5px;
    }

    .badge-poc {
      background: rgba(249, 115, 22, 0.15);
      color: #f97316;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      border: 1px solid rgba(249, 115, 22, 0.3);
    }

    .notification {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      padding: 0.85rem 1.5rem;
      border-radius: 10px;
      font-weight: 500;
      z-index: 100;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
      animation: slideIn 0.3s ease;
    }

    .notification.success {
      background: #10b981;
      color: #fff;
    }

    .notification.error {
      background: #ef4444;
      color: #fff;
    }

    @keyframes slideIn {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;

  constructor() {
    super();
    this.currentView = 'list';
    this.recipes = [];
    this.selectedRecipe = null;
    this.loading = false;
    this.searchQuery = '';
    this.notification = null;
  }

  firstUpdated() {
    this.fetchRecipes();
  }

  showNotification(message, type = 'success') {
    this.notification = { message, type };
    setTimeout(() => {
      this.notification = null;
    }, 4000);
  }

  async fetchRecipes(query = '') {
    this.loading = true;
    try {
      let url = '/api/recipes';
      if (query.trim()) {
        url = `/api/recipes/search?q=${encodeURIComponent(query.trim())}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        // Handle pagination structure or plain array
        this.recipes = Array.isArray(data) ? data : (data.recipes || data.data || []);
      } else {
        this.showNotification(data.message || 'Failed to fetch recipes', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showNotification('Network error connecting to API', 'error');
    } finally {
      this.loading = false;
    }
  }

  async handleSaveRecipe(e) {
    const { payload, id } = e.detail;
    try {
      const isEdit = Boolean(id);
      const url = isEdit ? `/api/recipes/${id}` : '/api/recipes';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        this.showNotification(`Recipe ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
        this.currentView = 'list';
        this.fetchRecipes(this.searchQuery);
      } else {
        this.showNotification(data.message || data.error || 'Failed to save recipe', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showNotification('Error saving recipe', 'error');
    }
  }

  async handleDeleteRecipe(e) {
    const recipeId = e.detail;
    if (!confirm('Are you sure you want to delete this recipe?')) return;

    try {
      const response = await fetch(`/api/recipes/${recipeId}`, { method: 'DELETE' });
      if (response.ok) {
        this.showNotification('Recipe deleted successfully', 'success');
        if (this.currentView === 'detail' && this.selectedRecipe?._id === recipeId) {
          this.currentView = 'list';
        }
        this.fetchRecipes(this.searchQuery);
      } else {
        const data = await response.json();
        this.showNotification(data.message || 'Failed to delete recipe', 'error');
      }
    } catch (err) {
      console.error(err);
      this.showNotification('Error deleting recipe', 'error');
    }
  }

  handleSearchChange(e) {
    this.searchQuery = e.detail.query;
    this.fetchRecipes(this.searchQuery);
  }

  render() {
    return html`
      ${this.notification ? html`
        <div class="notification ${this.notification.type}">
          ${this.notification.message}
        </div>
      ` : ''}

      <header class="app-header">
        <div class="brand" @click="${() => { this.currentView = 'list'; }}">
          <span class="brand-icon">🍳</span>
          <span class="brand-title">Foodz</span>
          <span class="badge-poc">Lit PoC</span>
        </div>
      </header>

      <main>
        ${this.currentView === 'list'
          ? html`
              <recipe-list
                .recipes="${this.recipes}"
                .loading="${this.loading}"
                .searchQuery="${this.searchQuery}"
                @search-change="${this.handleSearchChange}"
                @open-create="${() => { this.selectedRecipe = null; this.currentView = 'form'; }}"
                @view-recipe="${e => { this.selectedRecipe = e.detail; this.currentView = 'detail'; }}"
                @edit-recipe="${e => { this.selectedRecipe = e.detail; this.currentView = 'form'; }}"
                @delete-recipe="${this.handleDeleteRecipe}"
              ></recipe-list>
            `
          : ''}

        ${this.currentView === 'detail'
          ? html`
              <recipe-detail
                .recipe="${this.selectedRecipe}"
                @back="${() => { this.currentView = 'list'; }}"
                @edit-recipe="${e => { this.selectedRecipe = e.detail; this.currentView = 'form'; }}"
              ></recipe-detail>
            `
          : ''}

        ${this.currentView === 'form'
          ? html`
              <recipe-form
                .recipe="${this.selectedRecipe}"
                .isEdit="${Boolean(this.selectedRecipe)}"
                @save-recipe="${this.handleSaveRecipe}"
                @cancel="${() => { this.currentView = this.selectedRecipe ? 'detail' : 'list'; }}"
              ></recipe-form>
            `
          : ''}
      </main>
    `;
  }
}

customElements.define('foodz-app', FoodzApp);
