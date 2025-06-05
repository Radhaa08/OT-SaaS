import { Router } from 'express';
import stripeRouter from './stripe';
import userRouter from './users';
import jobSeekerRouter from './jobSeekers';
import jobRouter from './jobs';
import activityRouter from './activities';
import emailRouter from './emails';
import emailAuthRouter from './emailAuth';
import uploadRoutes from './upload';
const router = Router();

router.get('/', (req, res) => {
  res.send('API is working!');
});

router.use('/checkout', stripeRouter);
router.use('/users', userRouter);
router.use('/job-seekers', jobSeekerRouter);
router.use('/jobs', jobRouter);
router.use('/activities', activityRouter);
router.use('/emails', emailRouter);
router.use('/email-auth', emailAuthRouter);
router.use('/upload',uploadRoutes);

export default router;
