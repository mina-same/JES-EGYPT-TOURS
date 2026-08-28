import { revalidateTags } from '../services/revalidate';
import mongoose, { Document, Schema } from 'mongoose';
import {
  ILocalizedString,
  LocalizedStringSchema,
  OptionalLocalizedStringSchema,
} from './shared/LocalizedSchema';

/**
 * A titled card with a short body: one area of expertise, or one step in how
 * this author works. Per-author on purpose — the whole point of an author page
 * is that two authors cover different ground and work differently.
 */
export interface IAuthorCardItem {
  icon?: string;
  heading: ILocalizedString;
  body: ILocalizedString;
}

/** A photograph slot on the author page. */
export interface IAuthorPhoto {
  url: string;
  alt: ILocalizedString;
  caption?: ILocalizedString;
}

export interface IEditorialAuthor extends Document {
  name: string;
  slug: string;
  role: ILocalizedString;
  /** The lead paragraph under the author's name. */
  bio: ILocalizedString;
  /** The primary portrait. Leads the author page hero. */
  image: { url: string; alt: ILocalizedString };
  /**
   * The byline headshot, shown small and CIRCULAR under every article.
   *
   * Separate from `image` because the two crops are not interchangeable: the
   * hero portrait is a 3:4 half-length shot, and a circle cut out of its
   * middle leaves the subject small and off-centre. This is a close head-and-
   * shoulders frame that survives being masked to a circle at 80px. Falls back
   * to `image` for an author who has only one photograph.
   */
  avatar?: IAuthorPhoto;
  /**
   * One or two contextual photographs, each with its own caption. Two is the
   * cap on purpose: an author page is not a photo gallery.
   */
  contextImages?: IAuthorPhoto[];

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
  /** Short subject chips under the hero intro. */
  topics?: ILocalizedString[];
  aboutTitle?: ILocalizedString;
  /** Biography paragraphs, in order. */
  about?: ILocalizedString[];
  /** Subjects this author actually covers. */
  expertise?: IAuthorCardItem[];
  /** How this author prepares content — the dark section. */
  approach?: IAuthorCardItem[];

  isActive: boolean;
}

const AuthorPhotoSchema = new Schema(
  {
    url: { type: String, required: true },
    alt: { type: LocalizedStringSchema, required: true },
    caption: { type: OptionalLocalizedStringSchema },
  },
  { _id: false }
);

const AuthorCardItemSchema = new Schema(
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
  image: { type: AuthorPhotoSchema, required: true },
  avatar: { type: AuthorPhotoSchema },
  contextImages: { type: [AuthorPhotoSchema], default: undefined },

  organisation: { type: OptionalLocalizedStringSchema },
  contentFocus: { type: OptionalLocalizedStringSchema },
  languages: { type: OptionalLocalizedStringSchema },
  topics: { type: [OptionalLocalizedStringSchema], default: undefined },
  aboutTitle: { type: OptionalLocalizedStringSchema },
  about: { type: [OptionalLocalizedStringSchema], default: undefined },
  expertise: { type: [AuthorCardItemSchema], default: undefined },
  approach: { type: [AuthorCardItemSchema], default: undefined },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

/*
 * An author's own page is tagged with their slug; their articles' cards appear
 * under `blog`, so both are cleared when the author record changes.
 */
const revalidateAuthorCaches = function (this: unknown, doc: any) {
  const slug = doc?.slug ?? (doc as any)?._update?.$set?.slug;
  revalidateTags([...(slug ? [`author:${slug}`] : []), 'blog']);
};

EditorialAuthorSchema.post('save', revalidateAuthorCaches);
EditorialAuthorSchema.post('findOneAndUpdate', revalidateAuthorCaches);
EditorialAuthorSchema.post('updateOne', revalidateAuthorCaches);

export default mongoose.models.EditorialAuthor || mongoose.model<IEditorialAuthor>('EditorialAuthor', EditorialAuthorSchema);
