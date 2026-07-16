import mongoose, { Document, Schema } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema } from './shared/LocalizedSchema';

export interface ISliderUnderPromoConfig {
  text: ILocalizedString;
  linkText: ILocalizedString;
  /** Per-language destination URL (legacy documents may hold a plain string). */
  link: ILocalizedString;
  linkDirection: '_blank' | '_self';
  /** false = kept in the admin but hidden from visitors (disable without deleting). */
  isActive: boolean;
}

export interface ISliderPromoConfig extends Document {
  key: 'global';
  underPromo?: ISliderUnderPromoConfig;
  createdAt: Date;
  updatedAt: Date;
}

const SliderUnderPromoConfigSchema = new Schema<ISliderUnderPromoConfig>(
  {
    text: { type: LocalizedStringSchema },
    linkText: { type: LocalizedStringSchema },
    link: { type: LocalizedStringSchema },
    linkDirection: { type: String, enum: ['_blank', '_self'], default: '_self' },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SliderPromoConfigSchema = new Schema<ISliderPromoConfig>(
  {
    key: { type: String, unique: true, default: 'global' },
    underPromo: { type: SliderUnderPromoConfigSchema, required: false },
  },
  {
    timestamps: true,
  }
);

const SliderPromoConfig = mongoose.model<ISliderPromoConfig>('SliderPromoConfig', SliderPromoConfigSchema);

export default SliderPromoConfig;
