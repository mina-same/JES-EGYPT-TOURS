import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMenuItem {
  _id: Types.ObjectId;
  label: string;
  url?: string;
  isActive: boolean;
  order: number;
  children?: IMenuItem[];
}

export interface IMenu extends Document {
  key: string;
  title: string;
  isActive: boolean;
  items: IMenuItem[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    label: {
      type: String,
      required: [true, 'Label is required'],
      trim: true,
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
      type: String,
      required: [true, 'Title is required'],
      trim: true,
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
