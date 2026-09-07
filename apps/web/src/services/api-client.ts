import type {
  ApiError,
  ApiSuccess,
  CreateRecipe,
  Pagination,
  Recipe,
  UpdateRecipe,
} from '@mise/contracts';

export interface RecipeListOptions {
  query?: string;
  page?: number;
  limit?: number;
}

export interface RecipeListResult {
  recipes: Recipe[];
  pagination: Pagination;
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T; meta?: Record<string, unknown> | undefined }> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { 'content-type': 'application/json' } : {}), ...init?.headers },
  });
  const body = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!response.ok || !body.success)
    throw new Error(body.success ? 'Request failed' : body.error.message);
  return { data: body.data, meta: body.meta };
}

export const api = {
  list: async (options: string | RecipeListOptions = {}): Promise<RecipeListResult> => {
    const opts = typeof options === 'string' ? { query: options } : options;
    const query = opts.query?.trim() ?? '';
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;

    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    let path = '/api/recipes';
    if (query) {
      params.set('q', query);
      path = '/api/recipes/search';
    }

    const res = await request<Recipe[]>(`${path}?${params.toString()}`);
    const pagination = (res.meta?.pagination as Pagination) ?? {
      total: res.data.length,
      page,
      pages: Math.max(1, Math.ceil(res.data.length / limit)),
    };

    return { recipes: res.data, pagination };
  },
  create: async (recipe: CreateRecipe) => {
    const res = await request<Recipe>('/api/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
    return res.data;
  },
  update: async (id: string, recipe: UpdateRecipe) => {
    const res = await request<Recipe>(`/api/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
    return res.data;
  },
  delete: async (id: string) => {
    const res = await request<Record<string, never>>(`/api/recipes/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
