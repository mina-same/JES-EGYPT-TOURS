import mongoose, { Schema, Document } from 'mongoose';
import { IImage, ImageSchema } from './shared/ImageSchema';
import { ILocalizedString, LocalizedStringSchema } from './shared/LocalizedSchema';

// ==================== INTERFACES ====================

export interface ISliderButton {
  text: ILocalizedString;
  link: string;
  linkDirection: '_blank' | '_self'; // Controls how the link opens
}

export interface ISliderUnderPromo {
  text: ILocalizedString;
  linkText: ILocalizedString;
  link: string;
  linkDirection: '_blank' | '_self';
}

export interface ISliderContent extends Document {
  subtitle: ILocalizedString;
  title: ILocalizedString;
  titleSpan: ILocalizedString;
  titleEnd: ILocalizedString;
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
      type: LocalizedStringSchema,
      required: [true, 'Button text is required'],
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
      type: LocalizedStringSchema,
      required: [true, 'Promo text is required'],
    },
    linkText: {
      type: LocalizedStringSchema,
      required: [true, 'Promo link text is required'],
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
      type: LocalizedStringSchema,
      required: [true, 'Subtitle is required'],
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Title is required'],
    },
    titleSpan: {
      type: LocalizedStringSchema,
      required: [true, 'Title span is required'],
    },
    titleEnd: {
      type: LocalizedStringSchema,
      required: [true, 'Title end is required'],
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
