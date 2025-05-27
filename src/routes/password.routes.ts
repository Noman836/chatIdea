import { Router } from 'express';
import { forgotPassword ,resetPassword} from '../controllers/forgotPassword.controller';
const router = Router();

router.post('/forgot-password', async (req, res) => {
  await forgotPassword(req, res);
});

router.post('/reset-password', async (req, res) => {
  await resetPassword(req, res);
});

export default router;
