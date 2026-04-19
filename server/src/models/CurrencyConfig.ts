import mongoose, { Schema, Document } from 'mongoose';

export interface ICurrencyConfig extends Document {
  baseCurrency: string;
  rates: {
    EUR: number;
    GBP: number;
  };
  updatedAt: Date;
  createdAt: Date;
}

const CurrencyConfigSchema = new Schema<ICurrencyConfig>(
  {
    baseCurrency: {
      type: String,
      default: 'USD',
      enum: ['USD'],
    },
    rates: {
      EUR: {
        type: Number,
        required: [true, 'EUR rate is required'],
        min: [0.001, 'Rate must be positive'],
      },
      GBP: {
        type: Number,
        required: [true, 'GBP rate is required'],
        min: [0.001, 'Rate must be positive'],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ensure only one config document exists
CurrencyConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({
      baseCurrency: 'USD',
      rates: {
        EUR: 0.92,
        GBP: 0.79,
      },
    });
  }
  return config;
};

const CurrencyConfig = mongoose.model<ICurrencyConfig>('CurrencyConfig', CurrencyConfigSchema);

export default CurrencyConfig;
