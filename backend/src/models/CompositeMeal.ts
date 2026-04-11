import mongoose, { Schema, Document } from 'mongoose';

export interface ICompositeMealItem {
  foodId: mongoose.Types.ObjectId;
  quantity: number; // grams
}

export interface IMacros {
  calories: number;
  protein: number;
  netCarbs: number;
  fat: number;
}

export interface ICompositeMeal extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  items: ICompositeMealItem[];
  totalMacros: IMacros;
  createdAt: Date;
  updatedAt: Date;
}

const compositeMealSchema = new Schema<ICompositeMeal>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
      {
        foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
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

compositeMealSchema.index({ userId: 1 });

export default mongoose.model<ICompositeMeal>('CompositeMeal', compositeMealSchema);
