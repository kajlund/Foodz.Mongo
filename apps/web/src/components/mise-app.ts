import { LitElement, css, html, nothing } from 'lit';
import type { CreateRecipe, Ingredient, Instruction, Pagination, Recipe } from '@mise/contracts';
import phosphorRegular from '@phosphor-icons/web/regular?inline';
import phosphorBold from '@phosphor-icons/web/bold?inline';
import phosphorFill from '@phosphor-icons/web/fill?inline';
import { api } from '../services/api-client.js';

type View = 'list' | 'detail' | 'form';
type Draft = {
  name: string;
  by: string;
  description: string;
  rating: number;
  isFavorite: boolean;
  caloriesPerServing: string;
  prepTimeMinutes: string;
  cookTimeMinutes: string;
  servings: string;
  difficulty: CreateRecipe['difficulty'];
  course: string;
  cuisine: string;
  notes: string;
  tags: string;
  originUrl: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
};

const emptyDraft = (): Draft => ({
  name: '',
  by: '',
  description: '',
  rating: 0,
  isFavorite: false,
  caloriesPerServing: '',
  prepTimeMinutes: '',
  cookTimeMinutes: '',
  servings: '',
  difficulty: null,
  course: '',
  cuisine: '',
  notes: '',
  tags: '',
  originUrl: '',
  ingredients: [{ pos: 1, group: 'Ingredients', name: '', amount: '', unit: '' }],
  instructions: [{ pos: 1, group: 'Instructions', description: '' }],
});

export class MiseApp extends LitElement {
  protected createRenderRoot(): HTMLElement | DocumentFragment {
    const root = super.createRenderRoot();
    const iconStyles = document.createElement('style');
    iconStyles.textContent = `${phosphorRegular}\n${phosphorBold}\n${phosphorFill}`;
    root.append(iconStyles);
    return root;
  }

  static properties = {
    view: { state: true },
    recipes: { state: true },
    selected: { state: true },
    draft: { state: true },
    loading: { state: true },
    query: { state: true },
    page: { state: true },
    limit: { state: true },
    pagination: { state: true },
    theme: { state: true },
    message: { state: true },
    apiError: { state: true },
  };
  declare view: View;
  declare recipes: Recipe[];
  declare selected: Recipe | null;
  declare draft: Draft;
  declare loading: boolean;
  declare query: string;
  declare page: number;
  declare limit: number;
  declare pagination: Pagination;
  declare theme: 'light' | 'dark';
  declare message: string;
  declare apiError: string;
  private mediaQueryListener?: (e: MediaQueryListEvent) => void;

  constructor() {
    super();
    this.view = 'list';
    this.recipes = [];
    this.selected = null;
    this.draft = emptyDraft();
    this.loading = false;
    this.query = '';
    this.page = 1;
    this.limit = 10;
    this.pagination = { total: 0, page: 1, pages: 1 };
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('mise-theme') : null;
    const prefersDark =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    this.theme = saved === 'dark' || (!saved && prefersDark) ? 'dark' : 'light';
    this.message = '';
    this.apiError = '';
  }
  connectedCallback() {
    super.connectedCallback();
    this.applyTheme(this.theme);
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.mediaQueryListener = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem('mise-theme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      };
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', this.mediaQueryListener);
    }
    void this.load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.mediaQueryListener && typeof window !== 'undefined' && window.matchMedia) {
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', this.mediaQueryListener);
    }
  }

  applyTheme(theme: 'light' | 'dark') {
    this.theme = theme;
    this.dataset.theme = theme;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#151412' : '#f6f2e9');
    }
  }

  toggleTheme() {
    const next = this.theme === 'dark' ? 'light' : 'dark';
    try {
      localStorage.setItem('mise-theme', next);
    } catch {
      // Ignore storage errors in restricted environments
    }
    this.applyTheme(next);
  }
  async load() {
    this.loading = true;
    this.apiError = '';
    try {
      const result = await api.list({
        query: this.query,
        page: this.page,
        limit: this.limit,
      });
      this.recipes = result.recipes;
      this.pagination = result.pagination;
      if (this.pagination.pages > 0 && this.page > this.pagination.pages) {
        this.page = this.pagination.pages;
        return void (await this.load());
      }
    } catch (e) {
      this.apiError = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination.pages || page === this.page) return;
    this.page = page;
    void this.load();
    this.renderRoot
      .querySelector('.recipe-table')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  changeLimit(limit: number) {
    if (this.limit === limit) return;
    this.limit = limit;
    this.page = 1;
    void this.load();
  }

  private getVisiblePages(): (number | 'ellipsis')[] {
    const totalPages = this.pagination.pages;
    const current = this.page;
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (current <= 4) {
      return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    }
    if (current >= totalPages - 3) {
      return [
        1,
        'ellipsis',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', totalPages];
  }

  notify(value: unknown) {
    this.message = value instanceof Error ? value.message : String(value);
    window.setTimeout(() => (this.message = ''), 3500);
  }
  edit(recipe?: Recipe) {
    this.selected = recipe ?? null;
    this.draft = recipe
      ? {
          ...recipe,
          tags: recipe.tags.join(', '),
          caloriesPerServing: String(recipe.caloriesPerServing ?? ''),
          prepTimeMinutes: String(recipe.prepTimeMinutes ?? ''),
          cookTimeMinutes: String(recipe.cookTimeMinutes ?? ''),
          servings: String(recipe.servings ?? ''),
          difficulty: recipe.difficulty ?? null,
          course: recipe.course ?? '',
          cuisine: recipe.cuisine ?? '',
          notes: recipe.notes ?? '',
          isFavorite: recipe.isFavorite ?? false,
          ingredients: recipe.ingredients.map((x) => ({ ...x })),
          instructions: recipe.instructions.map((x) => ({ ...x })),
        }
      : emptyDraft();
    this.view = 'form';
  }
  field<K extends keyof Draft>(key: K, value: Draft[K]) {
    this.draft = { ...this.draft, [key]: value };
  }
  ingredient(index: number, key: keyof Ingredient, value: string) {
    this.field(
      'ingredients',
      this.draft.ingredients.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    );
  }
  instruction(index: number, value: string) {
    this.field(
      'instructions',
      this.draft.instructions.map((item, i) =>
        i === index ? { ...item, description: value } : item,
      ),
    );
  }
  removeIngredient(index: number) {
    this.field(
      'ingredients',
      this.draft.ingredients.filter((_, i) => i !== index),
    );
  }
  removeInstruction(index: number) {
    this.field(
      'instructions',
      this.draft.instructions.filter((_, i) => i !== index),
    );
  }
  private reorder<T extends { pos: number }>(items: T[], index: number, offset: -1 | 1): T[] {
    const destination = index + offset;
    if (destination < 0 || destination >= items.length) return items;

    const reordered = [...items];
    const current = reordered[index]!;
    reordered[index] = reordered[destination]!;
    reordered[destination] = current;
    return reordered.map((item, i) => ({ ...item, pos: i + 1 }));
  }
  moveIngredient(index: number, offset: -1 | 1) {
    this.field('ingredients', this.reorder(this.draft.ingredients, index, offset));
  }
  moveInstruction(index: number, offset: -1 | 1) {
    this.field('instructions', this.reorder(this.draft.instructions, index, offset));
  }
  private optionalNumber(value: string): number | null {
    return value.trim() === '' ? null : Number(value);
  }
  private formatTime(minutes: number | null | undefined): string {
    if (minutes == null) return '';
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    if (!hours) return `${remainder} min`;
    return remainder ? `${hours} h ${remainder} min` : `${hours} h`;
  }
  async save(event: SubmitEvent) {
    event.preventDefault();
    const payload: CreateRecipe = {
      userID: this.selected?.userID ?? '665544332211009988776655',
      name: this.draft.name.trim(),
      by: this.draft.by.trim(),
      description: this.draft.description.trim(),
      rating: Number(this.draft.rating),
      isFavorite: this.draft.isFavorite,
      caloriesPerServing: this.optionalNumber(this.draft.caloriesPerServing),
      prepTimeMinutes: this.optionalNumber(this.draft.prepTimeMinutes),
      cookTimeMinutes: this.optionalNumber(this.draft.cookTimeMinutes),
      servings: this.optionalNumber(this.draft.servings),
      difficulty: this.draft.difficulty,
      course: this.draft.course.trim(),
      cuisine: this.draft.cuisine.trim(),
      notes: this.draft.notes.trim(),
      originUrl: this.draft.originUrl.trim(),
      tags: this.draft.tags
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
      isPublic: true,
      ingredients: this.draft.ingredients
        .filter((x) => x.name.trim())
        .map((x, i) => ({ ...x, pos: i + 1, name: x.name.trim() })),
      instructions: this.draft.instructions
        .filter((x) => x.description.trim())
        .map((x, i) => ({ ...x, pos: i + 1, description: x.description.trim() })),
    };
    try {
      if (this.selected) {
        await api.update(this.selected._id, payload);
      } else {
        await api.create(payload);
        this.page = 1;
      }
      this.view = 'list';
      await this.load();
    } catch (e) {
      this.notify(e);
    }
  }
  remove(recipe?: Recipe): void {
    if (!recipe) {
      super.remove();
      return;
    }
    void this.deleteRecipe(recipe);
  }
  private async deleteRecipe(recipe: Recipe) {
    if (!confirm(`Delete “${recipe.name}”?`)) return;
    try {
      await api.delete(recipe._id);
      if (this.selected?._id === recipe._id) this.view = 'list';
      if (this.recipes.length === 1 && this.page > 1) {
        this.page -= 1;
      }
      await this.load();
    } catch (e) {
      this.notify(e);
    }
  }
  private category(recipe: Recipe) {
    const tags = recipe.tags.map((tag) => tag.toLowerCase());
    if (tags.some((tag) => ['vegetarian', 'vegan'].includes(tag)))
      return { label: 'Vegetarian', icon: 'ph-leaf' };
    if (tags.some((tag) => ['breakfast', 'brunch'].includes(tag)))
      return { label: 'Breakfast', icon: 'ph-egg' };
    if (tags.some((tag) => ['soup', 'stew'].includes(tag)))
      return { label: 'Soup', icon: 'ph-bowl-steam' };
    if (tags.some((tag) => ['fish', 'salmon', 'seafood'].includes(tag)))
      return { label: 'Seafood', icon: 'ph-fish-simple' };
    return { label: 'Recipe', icon: 'ph-cooking-pot' };
  }

  render() {
    return html` <header>
        <button
          class="brand"
          @click=${() => {
            this.query = '';
            this.page = 1;
            this.view = 'list';
            void this.load();
          }}
          aria-label="Go to recipes"
        >
          <img
            src=${this.theme === 'dark' ? '/brand/mise-dark.svg' : '/brand/mise-horizontal.svg'}
            alt="Mise"
          />
        </button>
        <button
          class="theme-toggle"
          @click=${() => this.toggleTheme()}
          aria-label=${this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title=${this.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <i class="ph ${this.theme === 'dark' ? 'ph-sun' : 'ph-moon'}"></i>
          <span>${this.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <img class="rosemary" src="/assets/rosemary-sprig.png" alt="" />
      </header>
      ${this.message ? html`<aside role="alert">${this.message}</aside>` : nothing}
      <main>
        ${this.view === 'list' ? this.list() : this.view === 'detail' ? this.detail() : this.form()}
      </main>`;
  }

  list() {
    return html` <section class="toolbar">
        <label class="search"
          ><i class="ph ph-magnifying-glass"></i
          ><input
            aria-label="Search recipes"
            placeholder="Search recipes..."
            .value=${this.query}
            @input=${(e: Event) => {
              this.query = (e.target as HTMLInputElement).value;
            }}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === 'Enter') {
                this.page = 1;
                void this.load();
              }
            }}
            @change=${() => {
              this.page = 1;
              void this.load();
            }}
          />
          ${
            this.query
              ? html`
                  <button
                    type="button"
                    class="search-clear"
                    aria-label="Clear search"
                    @click=${() => {
                      this.query = '';
                      this.page = 1;
                      void this.load();
                    }}
                  >
                    <i class="ph ph-x"></i>
                  </button>
                `
              : nothing
          }
        </label>
        <button class="primary" @click=${() => this.edit()}>
          <i class="ph ph-plus"></i>New recipe
        </button>
      </section>
      ${
        this.loading
          ? html`<p class="empty">Loading recipes...</p>`
          : this.apiError
            ? html`<section class="connection-error" role="alert">
                <i class="ph ph-plugs"></i>
                <div>
                  <h2>Cannot connect to the recipe server</h2>
                  <p>${this.apiError}</p>
                </div>
                <button @click=${() => void this.load()}>
                  <i class="ph ph-arrow-clockwise"></i>Retry
                </button>
              </section>`
            : this.recipes.length
              ? html`
                  <section class="recipe-table" aria-label="Recipes">
                    <div class="table-head">
                      <span>Recipe</span><span>Details</span><span>Rating</span><span>Actions</span>
                    </div>
                    ${this.recipes.map((recipe) => {
                      const category = this.category(recipe);
                      return html` <article>
                        <div class="recipe-cell">
                          <div class="category">
                            <span class="category-icon"><i class="ph ${category.icon}"></i></span
                            ><small>${category.label}</small>
                          </div>
                          <h2>
                            ${
                              recipe.isFavorite
                                ? html`<i
                                    class="ph-fill ph-heart favorite-mark"
                                    aria-label="Favorite"
                                  ></i>`
                                : nothing
                            }${recipe.name}
                          </h2>
                        </div>
                        <div class="details-cell">
                          <p>${recipe.description || 'No description yet.'}</p>
                          <div class="tags">
                            ${recipe.course ? html`<span>${recipe.course}</span>` : nothing}
                            ${recipe.cuisine ? html`<span>${recipe.cuisine}</span>` : nothing}
                            ${recipe.tags.map((tag) => html`<span>#${tag}</span>`)}
                          </div>
                          ${
                            recipe.prepTimeMinutes != null ||
                            recipe.cookTimeMinutes != null ||
                            recipe.servings != null
                              ? html`<div class="quick-facts">
                                  ${
                                    recipe.prepTimeMinutes != null || recipe.cookTimeMinutes != null
                                      ? html`<span
                                          ><i class="ph ph-clock"></i>${this.formatTime(
                                            (recipe.prepTimeMinutes ?? 0) +
                                              (recipe.cookTimeMinutes ?? 0),
                                          )}</span
                                        >`
                                      : nothing
                                  }
                                  ${
                                    recipe.servings != null
                                      ? html`<span
                                          ><i class="ph ph-users"></i>${recipe.servings}</span
                                        >`
                                      : nothing
                                  }
                                </div>`
                              : nothing
                          }
                        </div>
                        <div class="rating">
                          <i class="ph-fill ph-star"></i><span>${recipe.rating.toFixed(1)}</span>
                        </div>
                        <div class="actions">
                          <button
                            title="View"
                            aria-label=${`View ${recipe.name}`}
                            @click=${() => {
                              this.selected = recipe;
                              this.view = 'detail';
                            }}
                          >
                            <i class="ph ph-eye"></i><span>View</span>
                          </button>
                          <button
                            title="Edit"
                            aria-label=${`Edit ${recipe.name}`}
                            @click=${() => this.edit(recipe)}
                          >
                            <i class="ph ph-pencil-simple"></i><span>Edit</span>
                          </button>
                          <button
                            title="Delete"
                            aria-label=${`Delete ${recipe.name}`}
                            @click=${() => void this.remove(recipe)}
                          >
                            <i class="ph ph-trash"></i><span>Delete</span>
                          </button>
                        </div>
                      </article>`;
                    })}
                  </section>
                  ${this.renderPagination()}
                `
              : html`<p class="empty">No recipes found. Add the first one!</p>`
      }`;
  }

  private renderPagination() {
    const { total, page, pages } = this.pagination;
    if (total === 0) return nothing;

    const start = (page - 1) * this.limit + 1;
    const end = Math.min(page * this.limit, total);
    const visiblePages = this.getVisiblePages();

    return html`
      <nav class="pagination-bar" aria-label="Recipe pagination">
        <div class="pagination-summary">
          Showing <strong>${start}–${end}</strong> of <strong>${total}</strong> recipes
        </div>

        <div class="pagination-pages">
          <button
            class="pagination-step"
            ?disabled=${page <= 1}
            @click=${() => this.goToPage(page - 1)}
            aria-label="Previous page"
          >
            <i class="ph ph-caret-left"></i>
            <span>Previous</span>
          </button>

          <div class="page-numbers" role="list">
            ${visiblePages.map((item, idx) =>
              item === 'ellipsis'
                ? html`<span class="pagination-ellipsis" key="ellipsis-${idx}">…</span>`
                : html`
                    <button
                      class="page-number ${item === page ? 'active' : ''}"
                      ?disabled=${item === page}
                      aria-label="Page ${item}"
                      aria-current=${item === page ? 'page' : nothing}
                      @click=${() => this.goToPage(item)}
                    >
                      ${item}
                    </button>
                  `,
            )}
          </div>

          <button
            class="pagination-step"
            ?disabled=${page >= pages}
            @click=${() => this.goToPage(page + 1)}
            aria-label="Next page"
          >
            <span>Next</span>
            <i class="ph ph-caret-right"></i>
          </button>
        </div>

        <div class="pagination-limit">
          <label for="recipes-per-page">Show</label>
          <select
            id="recipes-per-page"
            aria-label="Recipes per page"
            .value=${String(this.limit)}
            @change=${(e: Event) => this.changeLimit(Number((e.target as HTMLSelectElement).value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
          </select>
          <span>per page</span>
        </div>
      </nav>
    `;
  }

  detail() {
    const r = this.selected;
    if (!r) return nothing;
    return html`<section class="panel">
      <nav>
        <button @click=${() => (this.view = 'list')}>
          <i class="ph ph-arrow-left"></i>Back to recipes</button
        ><button class="primary" @click=${() => this.edit(r)}>
          <i class="ph ph-pencil-simple"></i>Edit recipe
        </button>
      </nav>
      <div class="eyebrow">
        ${r.isFavorite ? html`<i class="ph-fill ph-heart"></i> Favorite recipe` : 'Recipe'}
      </div>
      <h1>${r.name}</h1>
      <p class="meta">
        ${r.by ? `By ${r.by} · ` : ''}<i class="ph-fill ph-star"></i> ${r.rating.toFixed(1)}
      </p>
      <p class="lede">${r.description}</p>
      <dl class="recipe-facts">
        ${
          r.prepTimeMinutes != null
            ? html`<div>
                <dt>Preparation</dt>
                <dd>${this.formatTime(r.prepTimeMinutes)}</dd>
              </div>`
            : nothing
        }
        ${
          r.cookTimeMinutes != null
            ? html`<div>
                <dt>Cooking</dt>
                <dd>${this.formatTime(r.cookTimeMinutes)}</dd>
              </div>`
            : nothing
        }
        ${
          r.prepTimeMinutes != null || r.cookTimeMinutes != null
            ? html`<div>
                <dt>Total time</dt>
                <dd>${this.formatTime((r.prepTimeMinutes ?? 0) + (r.cookTimeMinutes ?? 0))}</dd>
              </div>`
            : nothing
        }
        ${
          r.servings != null
            ? html`<div>
                <dt>Servings</dt>
                <dd>${r.servings}</dd>
              </div>`
            : nothing
        }
        ${
          r.caloriesPerServing != null
            ? html`<div>
                <dt>Per serving</dt>
                <dd>${r.caloriesPerServing} kcal</dd>
              </div>`
            : nothing
        }
        ${
          r.difficulty
            ? html`<div>
                <dt>Difficulty</dt>
                <dd class="capitalize">${r.difficulty}</dd>
              </div>`
            : nothing
        }
        ${
          r.course
            ? html`<div>
                <dt>Course</dt>
                <dd>${r.course}</dd>
              </div>`
            : nothing
        }
        ${
          r.cuisine
            ? html`<div>
                <dt>Cuisine</dt>
                <dd>${r.cuisine}</dd>
              </div>`
            : nothing
        }
      </dl>
      <div class="columns">
        <div>
          <h2>Ingredients</h2>
          <ul>
            ${r.ingredients.map((x) => html`<li><span>${x.name}</span><strong>${x.amount} ${x.unit}</strong></li>`)}
          </ul>
        </div>
        <div>
          <h2>Instructions</h2>
          <ol>
            ${r.instructions.map((x) => html`<li>${x.description}</li>`)}
          </ol>
        </div>
      </div>
      ${
        r.notes
          ? html`<section class="recipe-notes">
              <h2>Notes</h2>
              <p>${r.notes}</p>
            </section>`
          : nothing
      }
      ${r.originUrl ? html`<a href=${r.originUrl} target="_blank" rel="noopener">Original recipe <i class="ph ph-arrow-square-out"></i></a>` : nothing}
    </section>`;
  }

  form() {
    return html`<form class="panel recipe-form" @submit=${this.save}>
      <nav>
        <div>
          <div class="eyebrow">${this.selected ? 'Recipe editor' : 'Add to collection'}</div>
          <h1>${this.selected ? 'Edit recipe' : 'New recipe'}</h1>
          <p class="form-intro">
            Keep the essentials together, then build the recipe one row at a time.
          </p>
        </div>
        <button type="button" @click=${() => (this.view = this.selected ? 'detail' : 'list')}>
          Cancel
        </button>
      </nav>
      <section class="form-section">
        <div class="section-heading">
          <span>01</span>
          <div>
            <h2>Recipe details</h2>
            <p>Name, source and a short description.</p>
          </div>
        </div>
        <label
          >Name<input
            required
            .value=${this.draft.name}
            @input=${(e: Event) => this.field('name', (e.target as HTMLInputElement).value)}
        /></label>
        <div class="columns">
          <label
            >Author<input
              .value=${this.draft.by}
              @input=${(e: Event) => this.field('by', (e.target as HTMLInputElement).value)} /></label
          ><label
            >Rating <span class="hint">0–5</span
            ><input
              type="number"
              min="0"
              max="5"
              step=".5"
              .value=${String(this.draft.rating)}
              @input=${(e: Event) => this.field('rating', Number((e.target as HTMLInputElement).value))}
          /></label>
        </div>
        <label
          >Description<textarea
            .value=${this.draft.description}
            @input=${(e: Event) => this.field('description', (e.target as HTMLTextAreaElement).value)}
          ></textarea>
        </label>
        <div class="columns">
          <label
            >Tags <span class="hint">Comma separated</span
            ><input
              placeholder="breakfast, quick, vegetarian"
              .value=${this.draft.tags}
              @input=${(e: Event) => this.field('tags', (e.target as HTMLInputElement).value)} /></label
          ><label
            >Original recipe URL<input
              type="url"
              placeholder="https://…"
              .value=${this.draft.originUrl}
              @input=${(e: Event) => this.field('originUrl', (e.target as HTMLInputElement).value)}
          /></label>
        </div>
      </section>
      <section class="form-section">
        <div class="section-heading">
          <span>02</span>
          <div>
            <h2>Cooking details</h2>
            <p>Timing, yield and helpful ways to classify the recipe.</p>
          </div>
        </div>
        <label class="favorite-toggle">
          <input
            type="checkbox"
            .checked=${this.draft.isFavorite}
            @change=${(e: Event) =>
              this.field('isFavorite', (e.target as HTMLInputElement).checked)}
          />
          <i class="ph-fill ph-heart"></i>
          Mark as a favorite
        </label>
        <div class="metadata-grid">
          <label
            >Preparation <span class="hint">minutes</span
            ><input
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="20"
              .value=${this.draft.prepTimeMinutes}
              @input=${(e: Event) =>
                this.field('prepTimeMinutes', (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >Cooking <span class="hint">minutes</span
            ><input
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="45"
              .value=${this.draft.cookTimeMinutes}
              @input=${(e: Event) =>
                this.field('cookTimeMinutes', (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >Servings<input
              type="number"
              min="1"
              step="1"
              inputmode="numeric"
              placeholder="4"
              .value=${this.draft.servings}
              @input=${(e: Event) => this.field('servings', (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >Calories <span class="hint">kcal/serving</span
            ><input
              type="number"
              min="0"
              step="1"
              inputmode="numeric"
              placeholder="620"
              .value=${this.draft.caloriesPerServing}
              @input=${(e: Event) =>
                this.field('caloriesPerServing', (e.target as HTMLInputElement).value)}
          /></label>
        </div>
        <div class="classification-grid">
          <label
            >Course<input
              placeholder="Main course"
              .value=${this.draft.course}
              @input=${(e: Event) => this.field('course', (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >Cuisine<input
              placeholder="Italian"
              .value=${this.draft.cuisine}
              @input=${(e: Event) => this.field('cuisine', (e.target as HTMLInputElement).value)}
          /></label>
          <label
            >Difficulty<select
              .value=${this.draft.difficulty ?? ''}
              @change=${(e: Event) =>
                this.field(
                  'difficulty',
                  ((e.target as HTMLSelectElement).value || null) as CreateRecipe['difficulty'],
                )}
            >
              <option value="">Not specified</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select></label
          >
        </div>
        <label
          >Notes<textarea
            placeholder="Substitutions, serving ideas or anything to remember next timeâ€¦"
            .value=${this.draft.notes}
            @input=${(e: Event) => this.field('notes', (e.target as HTMLTextAreaElement).value)}
          ></textarea>
        </label>
      </section>
      <section class="form-section">
        <div class="section-heading">
          <span>03</span>
          <div>
            <h2>Ingredients</h2>
            <p>Use one ingredient per row.</p>
          </div>
        </div>
        <div class="ingredient-head" aria-hidden="true">
          <span>Ingredient</span><span>Amount</span><span>Unit</span><span></span>
        </div>
        ${this.draft.ingredients.map(
          (x, i) =>
            html`<div class="ingredient-row">
              <span class="row-number">${i + 1}</span
              ><input
                aria-label=${`Ingredient ${i + 1}`}
                placeholder="e.g. Rolled oats"
                .value=${x.name}
                @input=${(e: Event) => this.ingredient(i, 'name', (e.target as HTMLInputElement).value)}
              /><input
                aria-label=${`Amount for ingredient ${i + 1}`}
                placeholder="150"
                .value=${String(x.amount)}
                @input=${(e: Event) => this.ingredient(i, 'amount', (e.target as HTMLInputElement).value)}
              /><input
                aria-label=${`Unit for ingredient ${i + 1}`}
                placeholder="g"
                .value=${x.unit}
                @input=${(e: Event) => this.ingredient(i, 'unit', (e.target as HTMLInputElement).value)}
              />
              <div class="row-actions">
                <button
                  class="icon-button reorder-button"
                  type="button"
                  aria-label=${`Move ingredient ${i + 1} up`}
                  ?disabled=${i === 0}
                  @click=${() => this.moveIngredient(i, -1)}
                >
                  <i class="ph ph-arrow-up"></i>
                </button>
                <button
                  class="icon-button reorder-button"
                  type="button"
                  aria-label=${`Move ingredient ${i + 1} down`}
                  ?disabled=${i === this.draft.ingredients.length - 1}
                  @click=${() => this.moveIngredient(i, 1)}
                >
                  <i class="ph ph-arrow-down"></i>
                </button>
                <button
                  class="icon-button remove-button"
                  type="button"
                  aria-label=${`Remove ingredient ${i + 1}`}
                  @click=${() => this.removeIngredient(i)}
                >
                  <i class="ph ph-x"></i>
                </button>
              </div>
            </div>`,
        )}<button
          class="add-row"
          type="button"
          @click=${() => this.field('ingredients', [...this.draft.ingredients, { pos: this.draft.ingredients.length + 1, group: 'Ingredients', name: '', amount: '', unit: '' }])}
        >
          <i class="ph ph-plus"></i>Add ingredient
        </button>
      </section>
      <section class="form-section">
        <div class="section-heading">
          <span>04</span>
          <div>
            <h2>Instructions</h2>
            <p>Write each action as a separate step.</p>
          </div>
        </div>
        ${this.draft.instructions.map(
          (x, i) =>
            html`<div class="step-row">
              <span class="step-number">${i + 1}</span
              ><textarea
                rows="2"
                aria-label=${`Instruction ${i + 1}`}
                placeholder="Describe this step…"
                .value=${x.description}
                @input=${(e: Event) => this.instruction(i, (e.target as HTMLTextAreaElement).value)}
              ></textarea>
              <div class="row-actions">
                <button
                  class="icon-button reorder-button"
                  type="button"
                  aria-label=${`Move instruction ${i + 1} up`}
                  ?disabled=${i === 0}
                  @click=${() => this.moveInstruction(i, -1)}
                >
                  <i class="ph ph-arrow-up"></i>
                </button>
                <button
                  class="icon-button reorder-button"
                  type="button"
                  aria-label=${`Move instruction ${i + 1} down`}
                  ?disabled=${i === this.draft.instructions.length - 1}
                  @click=${() => this.moveInstruction(i, 1)}
                >
                  <i class="ph ph-arrow-down"></i>
                </button>
                <button
                  class="icon-button remove-button"
                  type="button"
                  aria-label=${`Remove instruction ${i + 1}`}
                  @click=${() => this.removeInstruction(i)}
                >
                  <i class="ph ph-x"></i>
                </button>
              </div>
            </div>`,
        )}<button
          class="add-row"
          type="button"
          @click=${() => this.field('instructions', [...this.draft.instructions, { pos: this.draft.instructions.length + 1, group: 'Instructions', description: '' }])}
        >
          <i class="ph ph-plus"></i>Add step
        </button>
      </section>
      <footer class="form-actions">
        <span>Changes are saved when you submit.</span
        ><button type="button" @click=${() => (this.view = this.selected ? 'detail' : 'list')}>
          Cancel</button
        ><button class="primary" type="submit"><i class="ph ph-floppy-disk"></i>Save recipe</button>
      </footer>
    </form>`;
  }

  static styles = css`
    * {
      box-sizing: border-box;
    }
    :host {
      display: block;
      max-width: 1480px;
      margin: auto;
      padding: 28px 52px 56px;
      color: var(--ink);
      --ink: #263127;
      --muted: #687164;
      --line: #d9d2c4;
      --green: #405c35;
      --green-soft: #edf1e7;
      --gold: #e5a321;

      --bg-panel: #fffdf9cc;
      --bg-card: #fffdf899;
      --bg-table-head: transparent;
      --table-head-color: #4b5049;
      --bg-input: #fffefb;
      --border-input: #cfc8bb;
      --bg-search: #fffdfa99;
      --border-search: var(--line);
      --shadow-search: inset 0 0 0 1px #ffffff80;

      --bg-btn: #fffdf8;
      --border-btn: #cfc8bb;
      --color-btn: #394237;
      --bg-btn-hover: #f2eee5;
      --border-btn-hover: #bcb3a4;

      --primary: #eca51b;
      --primary-border: #e4a020;
      --primary-hover: #d99210;
      --primary-color: #ffffff;
      --primary-shadow: 0 5px 14px #b5791e2b;

      --table-border: #d2cabd;
      --table-shadow: 0 10px 30px #705c3720;
      --article-hover: #fcfaf4;
      --row-line: var(--line);

      --category-bg: var(--green-soft);
      --category-color: var(--green);
      --category-label: #557746;

      --tag-bg: #fffefb;
      --tag-border: #b9c4ab;
      --tag-color: #394438;

      --badge-number-bg: #f0ede5;
      --badge-number-color: #647060;

      --error-bg: #fff8f3;
      --error-border: #d9a58f;
      --error-color: #713824;
      --error-muted: #815747;

      --aside-bg: #9b3e2b;
      --aside-color: #ffffff;

      --rosemary-filter: none;
      --rosemary-opacity: 0.72;
      --rosemary-blend: multiply;
    }

    :host([data-theme='dark']) {
      --ink: #ede8df;
      --muted: #a39e94;
      --line: #2b2924;
      --green: #8faf76;
      --green-soft: #25291f;
      --gold: #e57e3b;

      --bg-panel: #1a1916f5;
      --bg-card: #1a1916f0;
      --bg-table-head: #161513;
      --table-head-color: #8c867b;
      --bg-input: #151412;
      --border-input: #36342d;
      --bg-search: #1f1e1a;
      --border-search: #323028;
      --shadow-search: inset 0 0 0 1px #ffffff08;

      --bg-btn: #211f1b;
      --border-btn: #36342d;
      --color-btn: #ede8df;
      --bg-btn-hover: #2d2a24;
      --border-btn-hover: #4a473e;

      --primary: #de6537;
      --primary-border: #d1582b;
      --primary-hover: #ca5023;
      --primary-color: #ffffff;
      --primary-shadow: 0 5px 14px #de653733;

      --table-border: #2b2924;
      --table-shadow: 0 12px 36px #00000077;
      --article-hover: #1f1e1a;
      --row-line: #262420;

      --category-bg: #25291f;
      --category-color: #8faf76;
      --category-label: #7d9b65;

      --tag-bg: #22201c;
      --tag-border: #37352d;
      --tag-color: #cac5b8;

      --badge-number-bg: #25231f;
      --badge-number-color: #a39e94;

      --error-bg: #2a1916;
      --error-border: #5a2820;
      --error-color: #f2a696;
      --error-muted: #d08777;

      --aside-bg: #802e20;
      --aside-color: #ffffff;

      --rosemary-filter: invert(1) brightness(0.85) sepia(0.4) hue-rotate(50deg);
      --rosemary-opacity: 0.65;
      --rosemary-blend: screen;
    }

    header {
      height: 98px;
      display: flex;
      align-items: center;
      position: relative;
      border-bottom: 1px solid var(--line);
      margin-bottom: 33px;
      overflow: visible;
    }
    .brand {
      display: flex;
      align-items: center;
      padding: 0;
      border: 0;
      background: transparent;
    }
    .brand img {
      display: block;
      width: 235px;
      height: 68px;
      object-fit: contain;
      object-position: left center;
    }
    .theme-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-left: 20px;
      padding: 0.5rem 0.95rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      border: 1px solid var(--border-btn);
      background: var(--bg-btn);
      color: var(--color-btn);
      box-shadow: 0 2px 6px #0000000a;
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    }
    .theme-toggle:hover {
      background: var(--bg-btn-hover);
      border-color: var(--border-btn-hover);
    }
    .theme-toggle i {
      margin: 0;
      font-size: 1.05rem;
      color: var(--gold);
    }
    .rosemary {
      position: absolute;
      right: 10px;
      top: -40px;
      width: 235px;
      height: 125px;
      object-fit: contain;
      opacity: var(--rosemary-opacity);
      mix-blend-mode: var(--rosemary-blend);
      filter: var(--rosemary-filter);
      transition:
        opacity 0.2s,
        filter 0.2s;
    }
    aside {
      position: fixed;
      right: 1.25rem;
      top: 1.25rem;
      background: var(--aside-bg);
      color: var(--aside-color);
      padding: 1rem 1.2rem;
      border-radius: 7px;
      z-index: 10;
      box-shadow: 0 10px 30px #00000033;
    }
    .toolbar {
      display: flex;
      justify-content: space-between;
      gap: 2rem;
      align-items: center;
      margin-bottom: 28px;
    }
    .search {
      width: min(580px, 52%);
      height: 59px;
      display: flex;
      align-items: center;
      gap: 16px;
      border: 1px solid var(--border-search);
      background: var(--bg-search);
      border-radius: 7px;
      padding: 0 20px;
      color: var(--muted);
      box-shadow: var(--shadow-search);
    }
    .search i {
      font-size: 1.5rem;
    }
    .search input {
      flex: 1;
      border: 0;
      background: transparent;
      padding: 0;
      font-size: 1rem;
      color: var(--ink);
    }
    .search input::placeholder {
      color: var(--muted);
      opacity: 0.8;
    }
    .search-clear {
      display: grid;
      place-items: center;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--muted);
      cursor: pointer;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      transition:
        background 0.15s,
        color 0.15s;
    }
    .search-clear:hover {
      background: var(--bg-btn-hover);
      color: var(--ink);
    }
    .search-clear i {
      margin: 0;
      font-size: 1.1rem;
    }
    button {
      border: 1px solid var(--border-btn);
      background: var(--bg-btn);
      color: var(--color-btn);
      border-radius: 6px;
      padding: 0.62rem 0.9rem;
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s,
        transform 0.15s;
    }
    button:hover {
      background: var(--bg-btn-hover);
      border-color: var(--border-btn-hover);
    }
    button:active {
      transform: translateY(1px);
    }
    button i {
      margin-right: 0.4rem;
    }
    .primary {
      background: var(--primary);
      border-color: var(--primary-border);
      color: var(--primary-color);
      font-weight: 600;
      padding: 1rem 1.45rem;
      box-shadow: var(--primary-shadow);
    }
    .primary:hover {
      background: var(--primary-hover);
      border-color: var(--primary-hover);
    }
    .recipe-table {
      border: 1px solid var(--table-border);
      border-radius: 10px;
      background: var(--bg-card);
      overflow: hidden;
      box-shadow: var(--table-shadow);
    }
    .table-head,
    article {
      display: grid;
      grid-template-columns: minmax(330px, 1.5fr) minmax(390px, 1.45fr) 120px 170px;
      align-items: center;
    }
    .table-head {
      min-height: 57px;
      padding: 0 30px;
      border-bottom: 1px solid var(--row-line);
      font-size: 0.71rem;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: var(--table-head-color);
      background: var(--bg-table-head);
    }
    .table-head span:nth-child(3),
    .table-head span:last-child {
      text-align: center;
    }
    article {
      min-height: 116px;
      padding: 15px 30px;
      border-bottom: 1px solid var(--row-line);
      transition: background 0.15s;
    }
    article:hover {
      background: var(--article-hover);
    }
    article:last-child {
      border-bottom: 0;
    }
    .recipe-cell {
      display: grid;
      grid-template-columns: 86px 1fr;
      align-items: center;
    }
    .category {
      grid-row: 1;
      display: flex;
      align-items: center;
      flex-direction: column;
      gap: 5px;
    }
    .category-icon {
      width: 49px;
      height: 49px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--category-bg);
      color: var(--category-color);
      font-size: 1.65rem;
    }
    .category small {
      text-transform: uppercase;
      color: var(--category-label);
      font-size: 0.64rem;
      letter-spacing: 0.06em;
    }
    .recipe-cell h2 {
      margin: 0;
      padding-right: 18px;
      color: var(--ink);
      font:
        600 1.78rem/1.1 'Cormorant Garamond',
        Georgia,
        serif;
      letter-spacing: -0.02em;
    }
    .favorite-mark {
      margin-right: 8px;
      color: #b9573f;
      font-size: 0.9em;
    }
    .details-cell {
      padding-right: 20px;
    }
    .details-cell p {
      margin: 0 0 12px;
      color: var(--muted);
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .tags span {
      border: 1px solid var(--tag-border);
      color: var(--tag-color);
      background: var(--tag-bg);
      border-radius: 7px;
      padding: 5px 11px;
      font-size: 0.69rem;
      line-height: 1;
    }
    .quick-facts {
      display: flex;
      gap: 14px;
      margin-top: 10px;
      color: var(--muted);
      font-size: 0.75rem;
    }
    .quick-facts span {
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .rating {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 7px;
      font-size: 1.03rem;
      color: var(--ink);
    }
    .rating i,
    .meta i {
      color: var(--gold);
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 4px;
    }
    .actions button {
      border: 0;
      background: transparent;
      padding: 0.55rem;
      color: var(--muted);
      font-size: 1.35rem;
    }
    .actions button:hover {
      color: var(--primary);
      background: var(--bg-btn-hover);
    }
    .actions span {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }
    .connection-error {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 18px;
      border: 1px solid var(--error-border);
      background: var(--error-bg);
      color: var(--error-color);
      border-radius: 10px;
      padding: 24px;
    }
    .connection-error > i {
      font-size: 2rem;
    }
    .connection-error h2 {
      margin: 0 0 4px;
      font:
        600 1.45rem 'Cormorant Garamond',
        Georgia,
        serif;
      color: var(--error-color);
    }
    .connection-error p {
      margin: 0;
      color: var(--error-muted);
    }
    .panel {
      max-width: 940px;
      margin: 0 auto;
      background: var(--bg-panel);
      border: 1px solid var(--table-border);
      border-radius: 10px;
      padding: 42px 48px;
      box-shadow: var(--table-shadow);
    }
    .panel nav,
    .panel footer,
    .row {
      display: flex;
      gap: 0.7rem;
      align-items: center;
    }
    .panel nav {
      justify-content: space-between;
      margin-bottom: 2rem;
    }
    .panel h1 {
      font:
        600 3rem/1.05 'Cormorant Garamond',
        Georgia,
        serif;
      color: var(--ink);
      margin: 0.2rem 0;
    }
    .panel h2 {
      font:
        600 1.7rem 'Cormorant Garamond',
        Georgia,
        serif;
      color: var(--ink);
      margin-top: 2rem;
    }
    .eyebrow {
      color: var(--green);
      font-size: 0.72rem;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-weight: 700;
    }
    .meta,
    .lede {
      color: var(--muted);
    }
    .lede {
      font-size: 1.08rem;
      line-height: 1.65;
    }
    .recipe-facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(115px, 1fr));
      gap: 1px;
      margin: 1.75rem 0 0;
      overflow: hidden;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--line);
    }
    .recipe-facts div {
      padding: 14px 16px;
      background: var(--bg-card);
    }
    .recipe-facts dt {
      margin-bottom: 5px;
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .recipe-facts dd {
      margin: 0;
      color: var(--ink);
      font-weight: 650;
    }
    .capitalize {
      text-transform: capitalize;
    }
    .recipe-notes p {
      color: var(--muted);
      line-height: 1.65;
      white-space: pre-wrap;
    }
    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .panel li {
      padding: 0.65rem 0.25rem;
      line-height: 1.5;
      color: var(--ink);
    }
    .panel ul {
      padding: 0;
      list-style: none;
    }
    .panel ul li {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px solid var(--line);
    }
    .panel > a {
      color: var(--primary);
    }
    .panel footer {
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    label {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.45rem;
      color: var(--ink);
      font-weight: 600;
      margin: 1rem 0;
      font-size: 0.85rem;
    }
    label input,
    label textarea,
    label select {
      grid-column: 1/-1;
    }
    .hint {
      justify-self: end;
      color: var(--muted);
      font-size: 0.72rem;
      font-weight: 400;
    }
    input,
    textarea,
    select {
      width: 100%;
      min-width: 0;
      background: var(--bg-input);
      border: 1px solid var(--border-input);
      border-radius: 6px;
      color: var(--ink);
      padding: 0.78rem 0.9rem;
    }
    select {
      min-height: 43px;
    }
    textarea {
      min-height: 7rem;
      resize: vertical;
    }
    .form-intro,
    .section-heading p {
      margin: 0.35rem 0 0;
      color: var(--muted);
      font-size: 0.86rem;
    }
    .metadata-grid,
    .classification-grid {
      display: grid;
      gap: 0 14px;
    }
    .metadata-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    .classification-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
    .favorite-toggle {
      display: inline-flex;
      grid-template-columns: none;
      align-items: center;
      gap: 9px;
      width: fit-content;
      cursor: pointer;
      color: var(--ink);
    }
    .favorite-toggle input {
      grid-column: auto;
      width: 18px;
      height: 18px;
      margin: 0;
      accent-color: #b9573f;
    }
    .favorite-toggle i {
      color: #b9573f;
    }
    .recipe-form {
      padding: 0;
    }
    .recipe-form > nav {
      padding: 38px 46px 25px;
      margin: 0;
    }
    .form-section {
      padding: 28px 46px 34px;
      border-top: 1px solid var(--line);
    }
    .section-heading {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-bottom: 17px;
    }
    .section-heading > span {
      display: grid;
      place-items: center;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: var(--category-bg);
      color: var(--category-color);
      font-size: 0.69rem;
      font-weight: 700;
    }
    .section-heading h2 {
      margin: 0;
      font-size: 1.55rem;
      color: var(--ink);
    }
    .ingredient-head,
    .ingredient-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 110px 110px 100px;
      gap: 8px;
      align-items: center;
    }
    .ingredient-head {
      padding: 0 0 6px 40px;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    .ingredient-row {
      grid-template-columns: 32px minmax(0, 1fr) 110px 110px 100px;
      margin-bottom: 8px;
    }
    .row-number,
    .step-number {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--badge-number-bg);
      color: var(--badge-number-color);
      font-size: 0.75rem;
      font-weight: 700;
    }
    .icon-button {
      display: grid;
      place-items: center;
      width: 36px;
      height: 36px;
      padding: 0;
      border-color: transparent;
      background: transparent;
      color: var(--muted);
    }
    .icon-button i {
      margin: 0;
    }
    .icon-button:hover {
      color: var(--primary);
      background: var(--bg-btn-hover);
    }
    .row-actions {
      display: flex;
      justify-content: flex-end;
      gap: 2px;
    }
    .row-actions .icon-button {
      width: 32px;
      height: 36px;
    }
    .reorder-button {
      color: var(--green);
    }
    .reorder-button:hover:not(:disabled) {
      color: var(--green);
      background: var(--category-bg);
    }
    .icon-button:disabled {
      color: var(--muted);
      opacity: 0.35;
      background: transparent;
      cursor: not-allowed;
    }
    .add-row {
      margin: 8px 0 0 40px;
      border-style: dashed;
      color: var(--green);
      background: transparent;
      font-weight: 600;
    }
    .add-row:hover {
      background: var(--category-bg);
    }
    .step-row {
      display: grid;
      grid-template-columns: 32px minmax(0, 1fr) 100px;
      gap: 8px;
      align-items: start;
      margin-bottom: 10px;
    }
    .step-row textarea {
      min-height: 64px;
    }
    .form-actions {
      position: sticky;
      bottom: 0;
      z-index: 2;
      margin: 0 !important;
      padding: 18px 46px;
      background: var(--bg-panel);
      border-top: 1px solid var(--line);
      box-shadow: 0 -8px 20px #00000015;
    }
    .form-actions > span {
      margin-right: auto;
      color: var(--muted);
      font-size: 0.78rem;
    }
    .form-actions .primary {
      width: auto;
    }
    .empty {
      text-align: center;
      color: var(--muted);
      padding: 5rem 1rem;
      border: 1px dashed var(--line);
      border-radius: 10px;
      background: var(--bg-card);
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-top: 24px;
      padding: 14px 22px;
      border: 1px solid var(--table-border);
      border-radius: 10px;
      background: var(--bg-card);
      box-shadow: var(--table-shadow);
      color: var(--ink);
    }
    .pagination-summary {
      font-size: 0.85rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .pagination-summary strong {
      color: var(--ink);
      font-weight: 600;
    }
    .pagination-pages {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .pagination-step {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 0.48rem 0.85rem;
      font-size: 0.82rem;
      font-weight: 600;
      border-radius: 6px;
      color: var(--color-btn);
      background: var(--bg-btn);
      border: 1px solid var(--border-btn);
      cursor: pointer;
    }
    .pagination-step:disabled {
      opacity: 0.35;
      cursor: not-allowed;
      border-color: var(--border-btn);
      background: var(--bg-btn);
    }
    .pagination-step i {
      margin: 0;
      font-size: 0.95rem;
    }
    .page-numbers {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .page-number {
      min-width: 36px;
      height: 36px;
      padding: 0 6px;
      display: grid;
      place-items: center;
      border-radius: 6px;
      border: 1px solid var(--border-btn);
      background: var(--bg-btn);
      color: var(--color-btn);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition:
        background 0.15s,
        border-color 0.15s,
        color 0.15s;
    }
    .page-number:hover:not(:disabled) {
      background: var(--bg-btn-hover);
      border-color: var(--border-btn-hover);
    }
    .page-number.active {
      background: var(--green);
      border-color: var(--green);
      color: #ffffff;
      font-weight: 700;
      cursor: default;
      box-shadow: 0 2px 8px #405c3533;
    }
    .pagination-ellipsis {
      padding: 0 4px;
      color: var(--muted);
      font-size: 0.9rem;
      letter-spacing: 0.1em;
      user-select: none;
    }
    .pagination-limit {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: var(--muted);
      white-space: nowrap;
    }
    .pagination-limit label {
      margin: 0;
      font-weight: 500;
      color: var(--muted);
    }
    .pagination-limit select {
      min-height: 34px;
      padding: 0.25rem 0.6rem;
      font-size: 0.82rem;
      border-radius: 6px;
      border: 1px solid var(--border-input);
      background: var(--bg-input);
      color: var(--ink);
      cursor: pointer;
      width: auto;
    }
    .pagination-limit span {
      color: var(--muted);
    }
    @media (max-width: 1050px) {
      :host {
        padding: 24px;
      }
      .table-head {
        display: none;
      }
      .recipe-table {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0;
        border: 0;
        background: transparent;
        box-shadow: none;
      }
      .recipe-table article {
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto auto;
        align-items: start;
        margin: -1px 0 0 -1px;
        border: 1px solid var(--line);
        padding: 24px;
        min-height: 275px;
        background: var(--bg-card);
      }
      .recipe-cell {
        grid-column: 1/-1;
        grid-template-columns: 68px 1fr;
      }
      .details-cell {
        grid-column: 1/-1;
        padding: 20px 0;
      }
      .details-cell p {
        white-space: normal;
      }
      .rating {
        justify-content: flex-start;
      }
      .actions {
        align-self: center;
      }
      .pagination-bar {
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 16px;
      }
      .pagination-summary {
        order: 1;
      }
      .pagination-pages {
        order: 2;
        flex-wrap: wrap;
        justify-content: center;
      }
      .pagination-limit {
        order: 3;
      }
    }
    @media (max-width: 680px) {
      :host {
        padding: 18px 16px 35px;
      }
      header {
        height: 75px;
        margin-bottom: 24px;
      }
      .brand {
        max-width: calc(100% - 130px);
      }
      .brand img {
        width: 190px;
        height: 56px;
      }
      .theme-toggle {
        margin-left: auto;
        margin-right: 50px;
        padding: 0.45rem 0.6rem;
      }
      .theme-toggle span {
        display: none;
      }
      .rosemary {
        width: 130px;
        height: 80px;
        right: -20px;
        top: -20px;
      }
      .toolbar {
        align-items: stretch;
        flex-direction: column;
        gap: 12px;
      }
      .search {
        width: 100%;
        height: 54px;
      }
      .primary {
        width: 100%;
      }
      .connection-error {
        grid-template-columns: auto 1fr;
      }
      .connection-error button {
        grid-column: 1/-1;
      }
      .recipe-table {
        grid-template-columns: 1fr;
      }
      .recipe-table article {
        margin: -1px 0 0;
        min-height: auto;
      }
      .recipe-cell h2 {
        font-size: 1.65rem;
      }
      .panel {
        padding: 28px 22px;
      }
      .recipe-form {
        padding: 0;
      }
      .recipe-form > nav,
      .form-section,
      .form-actions {
        padding-left: 20px;
        padding-right: 20px;
      }
      .panel nav {
        align-items: flex-start;
      }
      .panel h1 {
        font-size: 2.35rem;
      }
      .columns {
        grid-template-columns: 1fr;
        gap: 0;
      }
      .metadata-grid,
      .classification-grid {
        grid-template-columns: 1fr 1fr;
      }
      .ingredient-head {
        display: none;
      }
      .ingredient-row {
        grid-template-columns: 28px minmax(0, 1fr) 72px 64px;
        gap: 5px;
      }
      .ingredient-row .row-actions {
        grid-column: 2 / -1;
      }
      .step-row {
        grid-template-columns: 28px minmax(0, 1fr);
      }
      .step-row .row-actions {
        grid-column: 2;
      }
      .add-row {
        margin-left: 36px;
      }
      .form-actions > span {
        display: none;
      }
      .form-actions {
        display: grid;
        grid-template-columns: 1fr 1.5fr;
      }
      .form-actions .primary {
        width: 100%;
      }
      .actions button {
        display: flex;
        align-items: center;
        font-size: 1rem;
      }
      .actions span {
        position: static;
        width: auto;
        height: auto;
        overflow: visible;
        clip: auto;
      }
      .actions {
        gap: 0;
      }
      .pagination-bar {
        padding: 14px 10px;
        width: 100%;
      }
      .pagination-step span {
        display: none;
      }
      .pagination-step {
        padding: 0.45rem 0.6rem;
      }
      .page-number {
        min-width: 32px;
        height: 32px;
        font-size: 0.8rem;
      }
    }
  `;
}

customElements.define('mise-app', MiseApp);
