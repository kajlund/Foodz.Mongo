import type { ApiError,ApiSuccess,CreateRecipe,Recipe,UpdateRecipe } from '@foodz/contracts';
async function request<T>(path:string,init?:RequestInit):Promise<T>{
  const response=await fetch(path,{...init,headers:{...(init?.body?{'content-type':'application/json'}:{}),...init?.headers}}); const body=await response.json() as ApiSuccess<T>|ApiError;
  if(!response.ok||!body.success)throw new Error(body.success?'Request failed':body.error.message); return body.data;
}
export const api={
  list:(query='')=>request<Recipe[]>(query.trim()?`/api/recipes/search?q=${encodeURIComponent(query.trim())}`:'/api/recipes'),
  create:(recipe:CreateRecipe)=>request<Recipe>('/api/recipes',{method:'POST',body:JSON.stringify(recipe)}),
  update:(id:string,recipe:UpdateRecipe)=>request<Recipe>(`/api/recipes/${id}`,{method:'PUT',body:JSON.stringify(recipe)}),
  delete:(id:string)=>request<Record<string,never>>(`/api/recipes/${id}`,{method:'DELETE'}),
};
