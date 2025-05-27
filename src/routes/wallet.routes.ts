import { Router } from 'express';
import {createWallet} from '../controllers/wallet.controller'
import {authMiddleware} from '../middleware/authMiddleware'
import { verifyMnemonic } from '../controllers/verifyNemonics.controller';
const router = Router();

router.post('/create-nemonics',authMiddleware, async (req, res) => {
  await createWallet(req, res);
});

router.post('/verify-nemonics',authMiddleware, async (req, res) => {
  await verifyMnemonic(req, res);
});


export default router;
