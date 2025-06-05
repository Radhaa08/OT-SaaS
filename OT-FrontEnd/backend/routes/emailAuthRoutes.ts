import { Router } from 'express';
import { optionalAuth } from '../lib/auth/middleware';
import {
  sendVerificationOtp,
  verifyOtp,
  sendWelcomeEmail,
  requestPasswordReset
} from '../controllers/emailController';

const router = Router();

// Public routes (no auth required)
router.post('/send-otp', sendVerificationOtp);
router.post('/verify-otp', verifyOtp);
router.post('/request-reset', requestPasswordReset);

// Protected routes (optional auth)
router.post('/welcome', optionalAuth, sendWelcomeEmail);

export default router;