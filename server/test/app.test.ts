import pino from 'pino';
import { describe,expect,it,vi } from 'vitest';
import { createApp } from '../src/app.ts';

const logger=pino({enabled:false});
const app=(overrides:Record<string,unknown>={})=>createApp(service(overrides),logger,undefined,false);
function service(overrides:Record<string,unknown>={}) { return {getRecipes:vi.fn().mockResolvedValue({recipes:[],pagination:{total:0,page:1,pages:1}}),searchRecipes:vi.fn(),createRecipe:vi.fn(),getRecipeById:vi.fn(),updateRecipe:vi.fn(),deleteRecipe:vi.fn(),...overrides} as any; }
describe('Foodz API',()=>{
  it('reports health',async()=>{const response=await app().request('/health');expect(response.status).toBe(200);expect(await response.json()).toMatchObject({status:'OK'});});
  it('lists recipes with pagination metadata',async()=>{const response=await app().request('/api/recipes');expect(response.status).toBe(200);expect(await response.json()).toMatchObject({success:true,data:[],meta:{count:0}});});
  it('rejects invalid create payloads',async()=>{const response=await app().request('/api/recipes',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:''})});expect(response.status).toBe(400);expect(await response.json()).toMatchObject({success:false,error:{code:'VALIDATION_ERROR'}});});
  it('rejects malformed ids',async()=>{const response=await app().request('/api/recipes/nope');expect(response.status).toBe(400);expect(await response.json()).toMatchObject({error:{code:'INVALID_ID'}});});
});
