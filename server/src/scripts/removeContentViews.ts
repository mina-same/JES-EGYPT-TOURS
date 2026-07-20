import dotenv from 'dotenv';
import mongoose from 'mongoose';

/**
 * One-off, idempotent migration that removes the retired content views feature.
 *
 * Run with: npm run migrate:remove-views
 */

dotenv.config();

const removeViewCount = async (collectionName: 'blogs' | 'tours') => {
  const collection = mongoose.connection.db!.collection(collectionName);
  const documents = await collection.countDocuments({
    viewCount: { $exists: true },
  });

  if (documents > 0) {
    await collection.updateMany(
      { viewCount: { $exists: true } },
      { $unset: { viewCount: '' } }
    );
  }

  const index = (await collection.indexes()).find(
    (candidate) =>
      candidate.key?.viewCount === -1 && Object.keys(candidate.key).length === 1
  );

  if (index?.name) {
    await collection.dropIndex(index.name);
  }

  return { documents, indexRemoved: Boolean(index?.name) };
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    const [blogs, tours] = await Promise.all([
      removeViewCount('blogs'),
      removeViewCount('tours'),
    ]);

    const retiredMenuUrls = [
      '/blogs/all?sort=popular',
      '/tours/popular',
    ];
    await mongoose.connection.db!.collection('menus').updateMany(
      { 'items.children.url': { $in: retiredMenuUrls } },
      ({
        $pull: {
          'items.$[].children': { url: { $in: retiredMenuUrls } },
        },
      } as any)
    );

    console.log(
      `Content views removed. Blogs: ${blogs.documents} document(s), index ${
        blogs.indexRemoved ? 'removed' : 'not present'
      }. Tours: ${tours.documents} document(s), index ${
        tours.indexRemoved ? 'removed' : 'not present'
      }.`
    );
  } catch (error: any) {
    console.error('Failed to remove content views:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void run();
