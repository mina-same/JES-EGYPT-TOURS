import mongoose, { Schema, Document, Types } from 'mongoose';
import { LocalizedStringSchema, ILocalizedString } from './shared/LocalizedSchema';
import { revalidateTags } from '../services/revalidate';

export type MenuDisplayVariant = 'default' | 'promotion';

export interface IMenuItem {
  _id: Types.ObjectId;
  label: ILocalizedString;
  /** Per-language destination path ({ en, de, it, es }); legacy documents
   *  may still hold a plain string (used for every language). */
  url?: ILocalizedString | string;
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
    // Mixed on purpose: accepts the localized { en, de, it, es } object as
    // well as legacy plain strings, and stays optional (a parent item may
    // have no link). Shape is normalized in the controller's sanitizer.
    url: {
      type: Schema.Types.Mixed,
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


/**
 * The header navigation, rendered on EVERY page.
 *
 * Mirrors what Blog.ts does: the visitor fetch is tagged and served from cache
 * until an editor actually changes the menu, at which point the tag is cleared
 * and the change is live immediately.
 */
const revalidateMenuCaches = () => revalidateTags(['menu']);

MenuSchema.post('save', revalidateMenuCaches);
MenuSchema.post('findOneAndUpdate', revalidateMenuCaches);
MenuSchema.post('findOneAndDelete', revalidateMenuCaches);
MenuSchema.post('deleteOne', revalidateMenuCaches);
MenuSchema.post('updateOne', revalidateMenuCaches);
MenuSchema.post('updateMany', revalidateMenuCaches);

const Menu = mongoose.model<IMenu>('Menu', MenuSchema);

export default Menu;