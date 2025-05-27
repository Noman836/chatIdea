import { Router } from 'express';
import { emailVerification } from '../controllers/emailVerify.controller';
import { resendOtp, verifyOtp } from '../controllers/verifyEmail';
import { authMiddleware } from '../middleware/authMiddleware';
import { loginUser } from '../controllers/login.controller';
const router = Router();

router.post('/email', async (req, res) => {
  await emailVerification(req, res);
});

router.post('/login', async (req, res) => {
  await loginUser(req, res);
});

router.post('/verify-otp', async (req, res) => {
  await verifyOtp(req, res);
});

router.post('/resend-otp', async (req, res) => {
  await resendOtp(req, res);
});


export default router;
