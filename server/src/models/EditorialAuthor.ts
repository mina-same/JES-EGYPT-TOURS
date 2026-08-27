import mongoose, { Document, Schema } from 'mongoose';
import {
  ILocalizedString,
  LocalizedStringSchema,
  OptionalLocalizedStringSchema,
} from './shared/LocalizedSchema';

/**
 * One editorial focus card on the author page: what this author's writing
 * actually covers. Per-author on purpose — the whole point of the author page
 * is that two authors cover different ground.
 */
export interface IEditorialFocusItem {
  icon?: string;
  heading: ILocalizedString;
  body: ILocalizedString;
}

export interface IEditorialAuthor extends Document {
  name: string;
  slug: string;
  role: ILocalizedString;
  /** The lead paragraph under the author's name. */
  bio: ILocalizedString;
  image: { url: string; alt: ILocalizedString };
  /** Extra portraits/photos. The page falls back to `image` when empty. */
  gallery?: { url: string; alt: ILocalizedString }[];

  /*
   * Everything below is OPTIONAL, and every section it feeds renders only when
   * it has content. That is what makes this route reusable: a new author can be
   * added with nothing but name, role, bio and image and still get a correct,
   * fully localized page — then grow into the full layout as the copy is
   * written, one field at a time, with no code change.
   */
  organisation?: ILocalizedString;
  contentFocus?: ILocalizedString;
  languages?: ILocalizedString;
  aboutTitle?: ILocalizedString;
  /** About-section paragraphs, in order. */
  about?: ILocalizedString[];
  editorialFocus?: IEditorialFocusItem[];
  /** The note under the author's article grid. */
  articlesNote?: ILocalizedString;

  isActive: boolean;
}

const AuthorImageSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: LocalizedStringSchema, required: true },
  },
  { _id: false }
);

const EditorialFocusItemSchema = new Schema(
  {
    // Rendered decoratively (aria-hidden), so it is free-form and optional.
    icon: { type: String, trim: true },
    heading: { type: OptionalLocalizedStringSchema, required: true },
    body: { type: OptionalLocalizedStringSchema, required: true },
  },
  { _id: false }
);

const EditorialAuthorSchema = new Schema<IEditorialAuthor>({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  role: { type: LocalizedStringSchema, required: true },
  bio: { type: LocalizedStringSchema, required: true },
  image: { type: AuthorImageSchema, required: true },
  gallery: { type: [AuthorImageSchema], default: undefined },

  organisation: { type: OptionalLocalizedStringSchema },
  contentFocus: { type: OptionalLocalizedStringSchema },
  languages: { type: OptionalLocalizedStringSchema },
  aboutTitle: { type: OptionalLocalizedStringSchema },
  about: { type: [OptionalLocalizedStringSchema], default: undefined },
  editorialFocus: { type: [EditorialFocusItemSchema], default: undefined },
  articlesNote: { type: OptionalLocalizedStringSchema },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.EditorialAuthor || mongoose.model<IEditorialAuthor>('EditorialAuthor', EditorialAuthorSchema);
