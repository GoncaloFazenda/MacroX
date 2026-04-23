import mongoose, { Schema, Document } from 'mongoose';
import type { IMealSlot } from './DailyPlan';

export interface IDayTemplate extends Document {
  name: string;
  userId: mongoose.Types.ObjectId;
  meals: IMealSlot[];
  totalMacros: {
    calories: number;
    protein: number;
    netCarbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const dayTemplateSchema = new Schema<IDayTemplate>(
  {
    name: { type: String, required: true, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    meals: [
      {
        slot: {
          type: String,
          required: true,
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        },
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

dayTemplateSchema.index({ userId: 1 });

export default mongoose.model<IDayTemplate>('DayTemplate', dayTemplateSchema);
