import mongoose, { Schema, Document } from 'mongoose';
import type { IMealSlot } from './DailyPlan';

export interface IWeekDay {
  dayOfWeek: number; // 0 = Monday, 6 = Sunday
  meals: IMealSlot[];
}

export interface IWeeklyPlan extends Document {
  userId: mongoose.Types.ObjectId;
  weekStart: Date;
  days: IWeekDay[];
  createdAt: Date;
  updatedAt: Date;
}

const weeklyPlanSchema = new Schema<IWeeklyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: Date, required: true },
    days: [
      {
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
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
      },
    ],
  },
  {
    timestamps: true,
  }
);

weeklyPlanSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

export default mongoose.model<IWeeklyPlan>('WeeklyPlan', weeklyPlanSchema);
