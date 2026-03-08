import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  description: string;
  type: 'restaurant' | 'cafe';
  emoji: string;
  phone: string;
  address: string;
  isActive: boolean;
  workingHours: {
    open: string;
    close: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['restaurant', 'cafe'],
      required: true,
    },
    emoji: {
      type: String,
      default: '🍽️',
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workingHours: {
      open: {
        type: String,
        default: '09:00',
      },
      close: {
        type: String,
        default: '23:00',
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IRestaurant>('Restaurant', restaurantSchema);