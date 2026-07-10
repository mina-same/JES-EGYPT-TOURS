import mongoose, { Schema, Document, Types } from 'mongoose';
import { LocalizedStringSchema, ILocalizedString } from './shared/LocalizedSchema';

export type MenuDisplayVariant = 'default' | 'promotion';

export interface IMenuItem {
  _id: Types.ObjectId;
  label: ILocalizedString;
  url?: string;
  isActive: boolean;
  order: number;
  displayVariant?: MenuDisplayVariant;
  children?: IMenuItem[];
}

export interface IMenu extends Document {
  key: string;
  title: ILocalizedString;
  isActive: boolean;
  items: IMenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    label: {
      type: LocalizedStringSchema,
      required: [true, 'Label is required'],
    },
    url: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    displayVariant: {
      type: String,
      enum: ['default', 'promotion'],
      default: 'default',
    },
  },
  { _id: true }
);

MenuItemSchema.add({
  children: [MenuItemSchema],
});

const MenuSchema = new Schema<IMenu>(
  {
    key: {
      type: String,
      required: [true, 'Key is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: LocalizedStringSchema,
      required: [true, 'Title is required'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    items: {
      type: [MenuItemSchema],
      default: [],
    },
  },
  { timestamps: true }
);

const Menu = mongoose.model<IMenu>('Menu', MenuSchema);

export default Menu;