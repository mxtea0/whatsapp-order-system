import mongoose, { Document, Schema } from 'mongoose';

export interface IWhatsAppSession extends Document {
  phone: string;
  currentStep: 'menu' | 'restaurant' | 'category' | 'product' | 'cart' | 'checkout';
  selectedRestaurantId?: mongoose.Types.ObjectId;
  selectedCategoryId?: mongoose.Types.ObjectId;
  cart: {
    productId: mongoose.Types.ObjectId;
    productName: string;
    quantity: number;
    price: number;
  }[];
  lastActivity: Date;
  createdAt: Date;
  updatedAt: Date;
}

const whatsAppSessionSchema = new Schema<IWhatsAppSession>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    currentStep: {
      type: String,
      enum: ['menu', 'restaurant', 'category', 'product', 'cart', 'checkout'],
      default: 'menu',
    },
    selectedRestaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
    },
    selectedCategoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
    },
    cart: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete sessions older than 24 hours
whatsAppSessionSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IWhatsAppSession>('WhatsAppSession', whatsAppSessionSchema);