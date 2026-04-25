import express from 'express';
import {
  getAllDestinations,
  getDestinationById,
  getDestinationBySlug,
  getBlogsByDestination,
  createDestination,
  updateDestination,
  deleteDestination,
  toggleDestinationStatus,
} from '../controllers/destinationController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';

const router = express.Router();

// Public routes
router.get('/', getAllDestinations);
router.get('/slug/:slug', getDestinationBySlug);
router.get('/:id/blogs', getBlogsByDestination);
router.get('/:id', getDestinationById);

// Admin routes
router.post('/', protect, permit(PERMISSIONS.BLOG_CREATE), createDestination);
router.put('/:id', protect, permit(PERMISSIONS.BLOG_UPDATE), updateDestination);
router.patch('/:id/toggle-active', protect, permit(PERMISSIONS.BLOG_UPDATE), toggleDestinationStatus);
router.delete('/:id', protect, permit(PERMISSIONS.BLOG_DELETE), deleteDestination);

export default router;
