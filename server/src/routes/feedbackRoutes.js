import express from 'express';
import { body } from 'express-validator';
import { createFeedback, getGivenFeedback, getReceivedFeedback } from '../controllers/feedbackController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.post(
  '/',
  protect,
  [
    body('to').isMongoId().withMessage('Recipient is required'),
    body('category').isIn(['teamwork', 'communication', 'technical', 'helpfulness']).withMessage('Invalid category'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer from 1 to 5'),
    body('comment').trim().notEmpty().withMessage('Comment is required').isLength({ max: 500 }).withMessage('Comment must be 500 characters or less'),
  ],
  createFeedback
);

router.get('/received', protect, getReceivedFeedback);
router.get('/given', protect, getGivenFeedback);

export default router;
