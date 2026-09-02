import mongoose, { type HydratedDocument, type Model, type Types } from 'mongoose';

const { Schema, model, models } = mongoose;
export interface RecipeDocument {
  userID: Types.ObjectId; name: string; originUrl: string; by: string; description: string; rating: number; tags: string[]; isPublic: boolean;
  ingredients: Array<{pos:number;group:string;name:string;amount:string|number;unit:string}>;
  instructions: Array<{pos:number;group:string;description:string}>; createdAt: Date; updatedAt: Date;
}
const ingredientSchema = new Schema({pos:{type:Number,required:true},group:{type:String,default:'Ingredients',trim:true},name:{type:String,required:true,trim:true},amount:{type:Schema.Types.Mixed,default:''},unit:{type:String,default:'',trim:true}});
const instructionSchema = new Schema({pos:{type:Number,required:true},group:{type:String,default:'Instructions',trim:true},description:{type:String,required:true,trim:true}});
const recipeSchema = new Schema<RecipeDocument>({
  userID:{type:Schema.Types.ObjectId,required:true,index:true},name:{type:String,required:true,trim:true},originUrl:{type:String,default:'',trim:true},by:{type:String,default:'',trim:true},description:{type:String,default:'',trim:true},rating:{type:Number,min:0,max:5,default:0},tags:{type:[String],default:[],index:true},isPublic:{type:Boolean,default:true,index:true},ingredients:{type:[ingredientSchema],default:[]},instructions:{type:[instructionSchema],default:[]}
},{timestamps:true});
recipeSchema.index({name:'text',description:'text',tags:'text','ingredients.name':'text'});
export type RecipeHydratedDocument = HydratedDocument<RecipeDocument>;
export const RecipeModel = (models.Recipe as Model<RecipeDocument>|undefined) ?? model<RecipeDocument>('Recipe',recipeSchema);
