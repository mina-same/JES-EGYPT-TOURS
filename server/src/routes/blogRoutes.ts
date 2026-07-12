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
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';
import { getEditorialAuthorBySlug, getEditorialAuthors } from '../controllers/editorialAuthorController';

const router = express.Router();

// ===== BLOG POST ROUTES =====
// Public routes
router.get('/authors', getEditorialAuthors);
router.get('/authors/:slug', getEditorialAuthorBySlug);
router.get('/posts/popular', getPopularBlogs); // Must be before /:slug
router.get('/posts/featured', getFeaturedBlogs);
router.get('/posts', getAllBlogs);
router.get('/posts/slug/:slug', getBlogBySlug);
router.get('/posts/id/:id', getBlogByIdPublic); // Public route for getting by ID
router.post('/posts/:id/comments', addComment);

// Admin routes
router.get('/posts/admin', protect, permit(PERMISSIONS.BLOG_READ), getAllBlogsAdmin);
router.get('/posts/:id', protect, permit(PERMISSIONS.BLOG_READ), getBlogById);
router.post('/posts', protect, permit(PERMISSIONS.BLOG_CREATE), createBlog);
router.put('/posts/:id', protect, permit(PERMISSIONS.BLOG_UPDATE), updateBlog);
router.patch('/posts/:id/publish', protect, permit(PERMISSIONS.BLOG_UPDATE), publishBlog);
router.patch('/posts/:id/unpublish', protect, permit(PERMISSIONS.BLOG_UPDATE), unpublishBlog);
router.patch('/posts/:id/toggle-comments', protect, permit(PERMISSIONS.BLOG_UPDATE), toggleComments);
router.delete('/posts/:id', protect, permit(PERMISSIONS.BLOG_DELETE), deleteBlog);

export default router;
