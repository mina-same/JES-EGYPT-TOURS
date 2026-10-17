import { publicSubmissionKeyValidation } from '../middleware/validation';
import { createBookingSubmissionLimiter } from '../middleware/bookingRateLimit';
import express from 'express';
import {
  createContactSubmission,
  createTravelTradeSubmission,
  createTourQuestionSubmission,
  getAllContactSubmissions,
  getContactSubmissionById,
  getContactStats,
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
const submissionLimiter = createBookingSubmissionLimiter();

router.post('/', submissionLimiter, publicSubmissionKeyValidation, contactSubmissionValidation, createContactSubmission);
router.post('/travel-trade', submissionLimiter, publicSubmissionKeyValidation, travelTradeInquiryValidation, createTravelTradeSubmission);
router.post('/tour-question', submissionLimiter, publicSubmissionKeyValidation, tourQuestionValidation, createTourQuestionSubmission);

router.get('/stats', protect, permit(PERMISSIONS.CONTACT_READ), getContactStats);
router.get('/:id', protect, permit(PERMISSIONS.CONTACT_READ), getContactSubmissionById);
router.get('/', protect, permit(PERMISSIONS.CONTACT_READ), getAllContactSubmissions);
router.patch('/:id', protect, permit(PERMISSIONS.CONTACT_UPDATE), updateContactSubmission);
router.delete('/:id', protect, permit(PERMISSIONS.CONTACT_DELETE), deleteContactSubmission);

export default router;
