import mongoose, { Schema, Document } from 'mongoose';

export interface IPlanItem {
  type: 'food' | 'compositeMeal';
  refId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IMealSlot {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  items: IPlanItem[];
}

export interface IDailyPlan extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  meals: IMealSlot[];
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanSchema = new Schema<IDailyPlan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
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
  {
    timestamps: true,
  }
);

dailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailyPlan>('DailyPlan', dailyPlanSchema);
