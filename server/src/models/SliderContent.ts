import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';

// ==================== INTERFACES ====================

export interface ISliderButton {
  text: string;
  link: string;
  linkDirection: '_blank' | '_self'; // Controls how the link opens
}

export interface ISliderUnderPromo {
  text: string;
  linkText: string;
  link: string;
  linkDirection: '_blank' | '_self';
}

export interface ISliderContent extends Document {
  subtitle: string;
  title: string;
  titleSpan: string;
  titleEnd: string;
  image: IImage;
  lineShape?: IImage;
  button?: ISliderButton;
  underPromo?: ISliderUnderPromo;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMAS ====================

const SliderButtonSchema = new Schema<ISliderButton>(
  {
    text: {
      type: String,
      required: [true, 'Button text is required'],
      trim: true,
      maxlength: [100, 'Button text cannot exceed 100 characters'],
    },
    link: {
      type: String,
      required: [true, 'Button link is required'],
      trim: true,
    },
    linkDirection: {
      type: String,
      enum: ['_blank', '_self'],
      default: '_self',
    },
  },
  { _id: false }
);

const SliderUnderPromoSchema = new Schema<ISliderUnderPromo>(
  {
    text: {
      type: String,
      required: [true, 'Promo text is required'],
      trim: true,
      maxlength: [500, 'Promo text cannot exceed 500 characters'],
    },
    linkText: {
      type: String,
      required: [true, 'Promo link text is required'],
      trim: true,
      maxlength: [100, 'Promo link text cannot exceed 100 characters'],
    },
    link: {
      type: String,
      required: [true, 'Promo link is required'],
      trim: true,
    },
    linkDirection: {
      type: String,
      enum: ['_blank', '_self'],
      default: '_self',
    },
  },
  { _id: false }
);

const SliderContentSchema = new Schema<ISliderContent>(
  {
    subtitle: {
      type: String,
      required: [true, 'Subtitle is required'],
      trim: true,
      maxlength: [200, 'Subtitle cannot exceed 200 characters'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    titleSpan: {
      type: String,
      required: [true, 'Title span is required'],
      trim: true,
      maxlength: [200, 'Title span cannot exceed 200 characters'],
    },
    titleEnd: {
      type: String,
      required: [true, 'Title end is required'],
      trim: true,
      maxlength: [200, 'Title end cannot exceed 200 characters'],
    },
    image: {
      type: ImageSchema,
      required: [true, 'Main image is required'],
    },
    lineShape: {
      type: ImageSchema,
      required: false,
    },
    button: {
      type: SliderButtonSchema,
      required: false,
    },
    underPromo: {
      type: SliderUnderPromoSchema,
      required: false,
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      min: [0, 'Order cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES ====================

SliderContentSchema.index({ order: 1 });
SliderContentSchema.index({ isActive: 1 });
SliderContentSchema.index({ order: 1, isActive: 1 });

// ==================== MIDDLEWARE ====================

// Ensure unique order values for active items
SliderContentSchema.pre('save', async function (next) {
  if (!this.isModified('order')) return next();

  try {
    const existingItem = await (this.constructor as typeof SliderContent).findOne({
      order: this.order,
      isActive: true,
      _id: { $ne: this._id },
    });

    if (existingItem) {
      // Increment order of existing items with same or higher order
      await (this.constructor as typeof SliderContent).updateMany(
        { order: { $gte: this.order }, isActive: true, _id: { $ne: this._id } },
        { $inc: { order: 1 } }
      );
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// ==================== MODEL ====================

const SliderContent = mongoose.model<ISliderContent>('SliderContent', SliderContentSchema);

export default SliderContent;
