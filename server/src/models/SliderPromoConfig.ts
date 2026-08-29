import mongoose, { Document, Schema } from 'mongoose';
import { ILocalizedString, LocalizedStringSchema } from './shared/LocalizedSchema';
import { revalidateTags } from '../services/revalidate';

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


/**
 * The promo bar under the hero — same cache tag as the slides it sits with.
 *
 * Mirrors what Blog.ts does: the visitor fetch is tagged and served from
 * cache until an editor actually changes something here, at which point the
 * tag is cleared and the change is live immediately. Without this hook the
 * only safe option is an uncached fetch on every page view.
 */
const revalidateSliderCaches = () => revalidateTags(['slider']);

SliderPromoConfigSchema.post('save', revalidateSliderCaches);
SliderPromoConfigSchema.post('findOneAndUpdate', revalidateSliderCaches);
SliderPromoConfigSchema.post('findOneAndDelete', revalidateSliderCaches);
SliderPromoConfigSchema.post('deleteOne', revalidateSliderCaches);
SliderPromoConfigSchema.post('updateOne', revalidateSliderCaches);
SliderPromoConfigSchema.post('updateMany', revalidateSliderCaches);

const SliderPromoConfig = mongoose.model<ISliderPromoConfig>('SliderPromoConfig', SliderPromoConfigSchema);

export default SliderPromoConfig;
