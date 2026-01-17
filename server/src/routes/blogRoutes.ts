import express from 'express';
import {
  getAllBlogs,
  getAllBlogsAdmin,
  getFeaturedBlogs,
  getBlogBySlug,
  getBlogByIdPublic,
  getBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  addComment,
  getPopularBlogs,
  publishBlog,
  unpublishBlog,
  toggleComments,
} from '../controllers/blogController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// ===== BLOG POST ROUTES =====
// Public routes
router.get('/posts/popular', getPopularBlogs); // Must be before /:slug
router.get('/posts/featured', getFeaturedBlogs);
router.get('/posts', getAllBlogs);
router.get('/posts/slug/:slug', getBlogBySlug);
router.get('/posts/id/:id', getBlogByIdPublic); // Public route for getting by ID
router.post('/posts/:id/comments', addComment);

// Admin routes
router.get('/posts/admin', protect, authorize('admin'), getAllBlogsAdmin);
router.get('/posts/:id', protect, authorize('admin'), getBlogById);
router.post('/posts', protect, authorize('admin'), createBlog);
router.put('/posts/:id', protect, authorize('admin'), updateBlog);
router.patch('/posts/:id/publish', protect, authorize('admin'), publishBlog);
router.patch('/posts/:id/unpublish', protect, authorize('admin'), unpublishBlog);
router.patch('/posts/:id/toggle-comments', protect, authorize('admin'), toggleComments);
router.delete('/posts/:id', protect, authorize('admin'), deleteBlog);

export default router;
