import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  goals: {
    calories: number;
    protein: number;
    netCarbs: number;
    fat: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    goals: {
      calories: { type: Number, default: 2000 },
      protein: { type: Number, default: 150 },
      netCarbs: { type: Number, default: 100 },
      fat: { type: Number, default: 65 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', userSchema);
