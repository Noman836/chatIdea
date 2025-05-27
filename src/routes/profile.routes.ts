import { Router } from 'express';
import multer from 'multer';
import {createWallet} from '../controllers/wallet.controller'
import {authMiddleware} from '../middleware/authMiddleware'
import { createProfile } from '../controllers/personalInfo.controller';
const router = Router();
const upload = multer();
router.post('/create-profile',authMiddleware,upload.single('file'), async (req, res) => {
  await createProfile(req, res);
});

export default router;
