import mongoose, { Schema, Document } from 'mongoose';

export interface IMealTemplateItem {
  type: 'food' | 'compositeMeal';
  refId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IMealTemplate extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  items: IMealTemplateItem[];
  totalMacros: {
    calories: number;
    protein: number;
    netCarbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const mealTemplateSchema = new Schema<IMealTemplate>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        type: {
          type: String,
          required: true,
          enum: ['food', 'compositeMeal'],
        },
        refId: { type: Schema.Types.ObjectId, required: true },
        quantity: { type: Number, required: true, min: 0.1 },
      },
    ],
    totalMacros: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      netCarbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

mealTemplateSchema.index({ userId: 1 });

export default mongoose.model<IMealTemplate>('MealTemplate', mealTemplateSchema);
