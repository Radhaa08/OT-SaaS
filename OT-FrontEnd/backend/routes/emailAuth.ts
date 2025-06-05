import { Router } from 'express';
import {
  sendVerificationOtp,
  verifyOtp,
  sendWelcomeEmail,
  requestPasswordReset
} from '../controllers/emailController';

const router = Router();

// Route to send verification OTP
router.post('/send-otp', sendVerificationOtp);

// Route to verify OTP
router.post('/verify-otp', verifyOtp);

// Route to send welcome email after successful registration
router.post('/welcome', sendWelcomeEmail);

// Route for password reset request
router.post('/request-reset', requestPasswordReset);

export default router;
