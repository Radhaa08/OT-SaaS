import { Router } from 'express';
import { requireAuth, requireAdmin } from '../lib/auth/middleware';
import {
  sendEmail,
  sendJobSeekerEmail,
  sendJobOpportunityEmail,
  verifyEmailService,
  sendTestEmail,
  sendSupportRequestEmail
} from '../controllers/emailController';

const router = Router();

// Route to send a generic email
router.post('/send', requireAuth, sendEmail);

// Route to send a job seeker email
router.post('/job-seeker', requireAuth, sendJobSeekerEmail);

// Route to send a job opportunity email
router.post('/job-opportunity', requireAuth, sendJobOpportunityEmail);

// Route to verify email service connection (admin only)
router.get('/verify', requireAdmin, verifyEmailService);

// Route to send a support request email
router.post('/support', sendSupportRequestEmail);

// Test route for development only
if (process.env.NODE_ENV !== 'production') {
  router.post('/test-send', sendTestEmail);
}

export default router;