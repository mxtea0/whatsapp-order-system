import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  emoji: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    emoji: {
      type: String,
      default: '🍴',
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
categorySchema.index({ restaurantId: 1, order: 1 });

export default mongoose.model<ICategory>('Category', categorySchema);