import express from 'express';
import {
  createContactSubmission,
  getAllContactSubmissions,
  updateContactSubmission,
  deleteContactSubmission,
} from '../controllers/contactController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';
import { contactSubmissionValidation } from '../middleware/validation';

const router = express.Router();

router.post('/', contactSubmissionValidation, createContactSubmission);

router.get('/', protect, permit(PERMISSIONS.CONTACT_READ), getAllContactSubmissions);
router.patch('/:id', protect, permit(PERMISSIONS.CONTACT_UPDATE), updateContactSubmission);
router.delete('/:id', protect, permit(PERMISSIONS.CONTACT_DELETE), deleteContactSubmission);

export default router;
