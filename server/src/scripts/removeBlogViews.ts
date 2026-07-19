import dotenv from 'dotenv';
import mongoose from 'mongoose';

/**
 * One-off, idempotent migration that removes the retired blog views feature.
 * It does not touch tour view counts.
 *
 * Run with: npm run migrate:remove-blog-views
 */

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);

    const db = mongoose.connection.db!;
    const blogs = db.collection('blogs');

    const blogsWithViewCount = await blogs.countDocuments({
      viewCount: { $exists: true },
    });

    if (blogsWithViewCount > 0) {
      await blogs.updateMany(
        { viewCount: { $exists: true } },
        { $unset: { viewCount: '' } }
      );
    }

    const viewCountIndex = (await blogs.indexes()).find(
      (index) => index.key?.viewCount === -1 && Object.keys(index.key).length === 1
    );

    if (viewCountIndex?.name) {
      await blogs.dropIndex(viewCountIndex.name);
    }

    const menus = db.collection<any>('menus');
    await menus.updateMany(
      { 'items.children.url': '/blogs/all?sort=popular' },
      ({
        $pull: {
          'items.$[].children': { url: '/blogs/all?sort=popular' },
        },
      } as any)
    );

    console.log(
      `Blog views removed: ${blogsWithViewCount} document(s), index ${
        viewCountIndex?.name ? 'removed' : 'not present'
      }.`
    );
  } catch (error: any) {
    console.error('Failed to remove blog views:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void run();
