import express from 'express';
import {
  createContactSubmission,
  createTravelTradeSubmission,
  createTourQuestionSubmission,
  getAllContactSubmissions,
  updateContactSubmission,
  deleteContactSubmission,
} from '../controllers/contactController';
import { protect, permit } from '../middleware/auth';
import { PERMISSIONS } from '../permissions';
import {
  contactSubmissionValidation,
  travelTradeInquiryValidation,
  tourQuestionValidation,
} from '../middleware/validation';

const router = express.Router();

router.post('/', contactSubmissionValidation, createContactSubmission);
router.post('/travel-trade', travelTradeInquiryValidation, createTravelTradeSubmission);
router.post('/tour-question', tourQuestionValidation, createTourQuestionSubmission);

router.get('/', protect, permit(PERMISSIONS.CONTACT_READ), getAllContactSubmissions);
router.patch('/:id', protect, permit(PERMISSIONS.CONTACT_UPDATE), updateContactSubmission);
router.delete('/:id', protect, permit(PERMISSIONS.CONTACT_DELETE), deleteContactSubmission);

export default router;
