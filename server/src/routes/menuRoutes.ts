import express from 'express';
import * as menuController from '../controllers/menuController';
import { protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public
router.get('/:key', menuController.getMenuByKey);

// Admin
router.use(protect);
router.use(authorize('admin'));

router.get('/admin/list', menuController.adminListMenus);
router.get('/admin/:id', menuController.adminGetMenuById);
router.post('/admin', menuController.adminCreateMenu);
router.put('/admin/:id', menuController.adminUpdateMenu);
router.delete('/admin/:id', menuController.adminDeleteMenu);

export default router;
