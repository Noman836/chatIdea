import { Request, Response } from 'express';
import { Wallet } from 'ethers';
import { decrypt } from '../utils/encyption'; // assumes you have this
import prisma from '../database/prismaClient';
import * as bip39 from 'bip39';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}
export const verifyMnemonic = async (req: AuthenticatedRequest, res: Response) => {
  try {
     if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { mnemonic } = req.body;

    if (!userId || !mnemonic) {
      return res.status(400).json({ message: 'User ID and mnemonic are required' });
    }

    // Validate mnemonic format (15 words, valid bip39)
    if (!bip39.validateMnemonic(mnemonic)) {
      return res.status(400).json({ message: 'Invalid mnemonic phrase' });
    }

    const walletFromInput = Wallet.fromMnemonic(mnemonic);
    const derivedAddress = walletFromInput.address;
const storedWallet = await prisma.wallet.findUnique({
  where: { userId },
});

if (!storedWallet) {
  return res.status(404).json({ message: 'Wallet not found for user' });
}

if (!storedWallet.encryptedPhrase) {
  return res.status(400).json({ message: 'No mnemonic phrase stored for this wallet' });
}

const decryptedMnemonic = decrypt(storedWallet.encryptedPhrase);

    return res.status(200).json({
      message: 'Mnemonic verified successfully',
      address: derivedAddress,
    });

  } catch (error) {
    console.error('Mnemonic Verification Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
