import express from 'express';
import {
  getNotifications,
  syncNotifications,
  acknowledgeNotifications,
  getAdminOverview,
  markAsRead,
  markEntityAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();


router.post('/ack', protect, acknowledgeNotifications);
router.get('/sync', protect, syncNotifications);
router.get('/overview', protect, getAdminOverview);
router.get('/', protect, getNotifications);
router.patch('/read-entity', protect, markEntityAsRead);
router.patch('/read-all', protect, markAllAsRead);
router.patch('/:id/read', protect, markAsRead);
router.delete('/:id', protect, deleteNotification);

export default router;
