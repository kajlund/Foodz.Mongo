import { LitElement, css, html, nothing } from 'lit';
import type { CreateRecipe, Ingredient, Instruction, Recipe } from '@mise/contracts';
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
    message: { state: true },
    apiError: { state: true },
  };
  declare view: View;
  declare recipes: Recipe[];
  declare selected: Recipe | null;
  declare draft: Draft;
  declare loading: boolean;
  declare query: string;
  declare message: string;
  declare apiError: string;

  constructor() {
    super();
    this.view = 'list';
    this.recipes = [];
    this.selected = null;
    this.draft = emptyDraft();
    this.loading = false;
    this.query = '';
    this.message = '';
    this.apiError = '';
  }
  connectedCallback() {
    super.connectedCallback();
    void this.load();
  }
  async load() {
    this.loading = true;
    this.apiError = '';
    try {
      this.recipes = await api.list(this.query);
    } catch (e) {
      this.apiError = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
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
            this.view = 'list';
            void this.load();
          }}
          aria-label="Go to recipes"
        >
          <img src="/brand/mise-horizontal.svg" alt="Mise" />
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
            @change=${(e: Event) => {
              this.query = (e.target as HTMLInputElement).value;
              void this.load();
            }}
        /></label>
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
              ? html` <section class="recipe-table" aria-label="Recipes">
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
                </section>`
              : html`<p class="empty">No recipes found. Add the first one!</p>`
      }`;
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
    }
    header {
      height: 98px;
      display: flex;
      align-items: flex-start;
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
    .rosemary {
      position: absolute;
      right: 10px;
      top: -40px;
      width: 235px;
      height: 125px;
      object-fit: contain;
      opacity: 0.72;
      mix-blend-mode: multiply;
    }
    aside {
      position: fixed;
      right: 1.25rem;
      top: 1.25rem;
      background: #9b3e2b;
      color: white;
      padding: 1rem 1.2rem;
      border-radius: 7px;
      z-index: 10;
      box-shadow: 0 10px 30px #51321933;
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
      border: 1px solid var(--line);
      background: #fffdfa99;
      border-radius: 7px;
      padding: 0 20px;
      color: #77766f;
      box-shadow: inset 0 0 0 1px #ffffff80;
    }
    .search i {
      font-size: 1.5rem;
    }
    .search input {
      border: 0;
      background: transparent;
      padding: 0;
      font-size: 1rem;
      color: var(--ink);
    }
    button {
      border: 1px solid #cfc8bb;
      background: #fffdf8;
      color: #394237;
      border-radius: 6px;
      padding: 0.62rem 0.9rem;
      transition:
        background 0.15s,
        border-color 0.15s,
        transform 0.15s;
    }
    button:hover {
      background: #f2eee5;
      border-color: #bcb3a4;
    }
    button:active {
      transform: translateY(1px);
    }
    button i {
      margin-right: 0.4rem;
    }
    .primary {
      background: #eca51b;
      border-color: #e4a020;
      color: white;
      font-weight: 600;
      padding: 1rem 1.45rem;
      box-shadow: 0 5px 14px #b5791e2b;
    }
    .primary:hover {
      background: #d99210;
      border-color: #d99210;
    }
    .recipe-table {
      border: 1px solid #d2cabd;
      border-radius: 10px;
      background: #fffdf899;
      overflow: hidden;
      box-shadow: 0 10px 30px #705c3720;
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
      border-bottom: 1px solid var(--line);
      font-size: 0.71rem;
      font-weight: 700;
      letter-spacing: 0.13em;
      text-transform: uppercase;
      color: #4b5049;
    }
    .table-head span:nth-child(3),
    .table-head span:last-child {
      text-align: center;
    }
    article {
      min-height: 116px;
      padding: 15px 30px;
      border-bottom: 1px solid var(--line);
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
      background: var(--green-soft);
      color: var(--green);
      font-size: 1.65rem;
    }
    .category small {
      text-transform: uppercase;
      color: #557746;
      font-size: 0.64rem;
      letter-spacing: 0.06em;
    }
    .recipe-cell h2 {
      margin: 0;
      padding-right: 18px;
      color: #202a22;
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
      color: #50574e;
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
      border: 1px solid #b9c4ab;
      color: #394438;
      background: #fffefb;
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
      color: #41463f;
      font-size: 1.35rem;
    }
    .actions button:hover {
      color: #a9542c;
      background: #f3eee4;
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
      border: 1px solid #d9a58f;
      background: #fff8f3;
      color: #713824;
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
    }
    .connection-error p {
      margin: 0;
      color: #815747;
    }
    .panel {
      max-width: 940px;
      margin: 0 auto;
      background: #fffdf9cc;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 42px 48px;
      box-shadow: 0 16px 45px #705c3722;
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
      color: #233226;
      margin: 0.2rem 0;
    }
    .panel h2 {
      font:
        600 1.7rem 'Cormorant Garamond',
        Georgia,
        serif;
      color: #2c402f;
      margin-top: 2rem;
    }
    .eyebrow {
      color: #6e8a5f;
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
      background: #fffdf9;
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
      color: #2c402f;
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
      color: #aa5a32;
    }
    .panel footer {
      justify-content: flex-end;
      margin-top: 1.5rem;
    }
    label {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.45rem;
      color: #4f5a4e;
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
      color: #858b81;
      font-size: 0.72rem;
      font-weight: 400;
    }
    input,
    textarea,
    select {
      width: 100%;
      min-width: 0;
      background: #fffefb;
      border: 1px solid #cfc8bb;
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
      background: var(--green-soft);
      color: var(--green);
      font-size: 0.69rem;
      font-weight: 700;
    }
    .section-heading h2 {
      margin: 0;
      font-size: 1.55rem;
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
      color: #777f74;
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
      background: #f0ede5;
      color: #647060;
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
      color: #8a7368;
    }
    .icon-button i {
      margin: 0;
    }
    .icon-button:hover {
      color: #9b3e2b;
      background: #f7e9e2;
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
      background: var(--green-soft);
    }
    .icon-button:disabled {
      color: #c8c8c2;
      background: transparent;
      cursor: not-allowed;
    }
    .add-row {
      margin: 8px 0 0 40px;
      border-style: dashed;
      color: var(--green);
      font-weight: 600;
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
      background: #fffdf9f5;
      border-top: 1px solid var(--line);
      box-shadow: 0 -8px 20px #705c3710;
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
      background: #fffdf966;
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
        background: #fffdf9aa;
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
        max-width: calc(100% - 105px);
      }
      .brand img {
        width: 190px;
        height: 56px;
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
    }
  `;
}

customElements.define('mise-app', MiseApp);
