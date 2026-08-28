/**
 * One-off: correct the house author's job title.
 *
 * The site carried two different titles for the same person. The author page
 * said "Travel Content Editor"; the database — and therefore the byline box on
 * every article — said "Travel Specialist", alongside a bio claiming tips from
 * trips she had taken herself. Two opposite seniority-and-experience claims
 * about one person, three clicks apart, is the kind of thing an E-E-A-T review
 * reads as unreliable.
 *
 * "Travel Content Editor" is the confirmed title, so that is what ships.
 *
 * This is a SCRIPT rather than part of the seed on purpose. The seed only ever
 * fills fields that are absent — it must never quietly overwrite an edit made
 * in the database — so correcting a value that is already there has to be an
 * explicit, deliberate action someone runs once.
 *
 *   npm run migrate:author-role
 */
import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import connectDB from '../config/database';
import EditorialAuthor from '../models/EditorialAuthor';
import {
  DEFAULT_AUTHOR_SEED,
  DEFAULT_AUTHOR_SLUG,
  RETIRED_AUTHOR_FIELDS,
} from '../seeds/defaultEditorialAuthor';

const run = async () => {
  await connectDB();

  const author = await EditorialAuthor.findOne({ slug: DEFAULT_AUTHOR_SLUG });
  if (!author) {
    console.log(`No author with slug "${DEFAULT_AUTHOR_SLUG}" — nothing to correct.`);
    return;
  }

  console.log('Before:', JSON.stringify(author.role));

  /*
   * The biography is rewritten too, not just the title.
   *
   * The old `about` text described the SITE's editorial policy — what gets
   * reviewed, when content is updated, what the site does not claim — on the
   * one page whose subject is a person. The policy material moved into the
   * author's `approach` cards, where it belongs, and `about` now describes
   * how she actually works. The seed cannot make that change on its own: it
   * only fills fields that are absent, and this one is present and wrong.
   */
  await EditorialAuthor.updateOne(
    { _id: author._id },
    {
      $set: {
        role: DEFAULT_AUTHOR_SEED.role,
        bio: DEFAULT_AUTHOR_SEED.bio,
        // The real photographs replace the single placeholder portrait the
        // page shipped with. `image` is set whole (url + alt + caption), not
        // just its alt, because the file itself changed.
        image: DEFAULT_AUTHOR_SEED.image,
        avatar: DEFAULT_AUTHOR_SEED.avatar,
        contextImages: DEFAULT_AUTHOR_SEED.contextImages,
        contentFocus: DEFAULT_AUTHOR_SEED.contentFocus,
        about: DEFAULT_AUTHOR_SEED.about,
        expertise: DEFAULT_AUTHOR_SEED.expertise,
        approach: DEFAULT_AUTHOR_SEED.approach,
        topics: DEFAULT_AUTHOR_SEED.topics,
      },
      /*
       * Fields from earlier shapes of this page. They are no longer schema
       * paths, which is exactly why this needs `strict: false` below: in
       * strict mode Mongoose silently DROPS update paths it does not know,
       * so the $unset was accepted, reported as done, and changed nothing.
       */
      $unset: RETIRED_AUTHOR_FIELDS.reduce<Record<string, ''>>((acc, field) => {
        acc[field] = '';
        return acc;
      }, {}),
    },
    { strict: false }
  );

  const updated = await EditorialAuthor.findById(author._id);
  console.log('After: ', JSON.stringify(updated?.role));
  console.log(`Retired fields removed: ${RETIRED_AUTHOR_FIELDS.join(', ')}`);
  console.log('Role, biography, expertise, approach, topics and portrait alt updated.');
};

run()
  .catch((error) => {
    console.error('Failed to correct the author role:', error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
