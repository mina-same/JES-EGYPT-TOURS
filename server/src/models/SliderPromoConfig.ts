import mongoose, { Document, Schema } from 'mongoose';

export interface ISliderUnderPromoConfig {
  text: string;
  linkText: string;
  link: string;
  linkDirection: '_blank' | '_self';
}

export interface ISliderPromoConfig extends Document {
  key: 'global';
  underPromo?: ISliderUnderPromoConfig;
  createdAt: Date;
  updatedAt: Date;
}

const SliderUnderPromoConfigSchema = new Schema<ISliderUnderPromoConfig>(
  {
    text: { type: String, trim: true },
    linkText: { type: String, trim: true },
    link: { type: String, trim: true },
    linkDirection: { type: String, enum: ['_blank', '_self'], default: '_self' },
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
