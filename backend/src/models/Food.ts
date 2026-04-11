import mongoose, { Schema, Document } from 'mongoose';

export interface IFood extends Document {
  name: string;
  protein: number;
  totalCarbs: number;
  fiber: number;
  netCarbs: number;
  fat: number;
  calories: number;
  category: string;
  isDefault: boolean;
  userId: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const foodSchema = new Schema<IFood>(
  {
    name: { type: String, required: true, trim: true },
    protein: { type: Number, required: true, min: 0 },
    totalCarbs: { type: Number, required: true, min: 0 },
    fiber: { type: Number, required: true, min: 0 },
    netCarbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    calories: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      required: true,
      enum: [
        'Protein', 'Vegetable', 'Fruit', 'Grain', 'Dairy',
        'Fat & Oil', 'Nut & Seed', 'Legume', 'Beverage', 'Condiment', 'Other',
      ],
    },
    isDefault: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

foodSchema.index({ name: 'text' });
foodSchema.index({ category: 1 });
foodSchema.index({ userId: 1 });

foodSchema.pre('save', function (next) {
  if (this.isModified('totalCarbs') || this.isModified('fiber')) {
    this.netCarbs = Math.max(0, this.totalCarbs - this.fiber);
  }
  next();
});

export default mongoose.model<IFood>('Food', foodSchema);
