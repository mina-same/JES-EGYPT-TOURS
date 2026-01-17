import express from 'express';
import {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { protect, authorize } from '../middleware/auth';
import { updateUserValidation } from '../middleware/validation';

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getAllUsers);

router
  .route('/:id')
  .get(getUser)
  .put(updateUserValidation, updateUser)
  .delete(deleteUser);

export default router;
