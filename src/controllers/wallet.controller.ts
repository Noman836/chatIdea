import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import { encrypt } from '../utils/encyption';
import { Wallet } from 'ethers';
import bcrypt from 'bcrypt';
import * as bip39 from 'bip39';
import crypto from 'crypto';  // import Node's crypto module


interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const createWallet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user.id;
    const { password, confirmPassword } = req.body;

    // Validate password input
    if (!password || !confirmPassword) {
      return res.status(400).json({ message: 'Password and confirm password are required' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.emailVerified || !user.otpVerified) {
      return res.status(403).json({ message: 'Please verify your email first' });
    }

    const existingWallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (existingWallet) {
      return res.status(400).json({ message: 'Wallet already exists' });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10); // saltRounds = 10

    // Generate 15-word mnemonic (160 bits entropy)
    const entropy = crypto.randomBytes(20); // 20 bytes = 160 bits
    const mnemonic15 = bip39.entropyToMnemonic(entropy);

    // Create wallet from 15-word mnemonic
    const wallet = Wallet.fromMnemonic(mnemonic15);

    // Encrypt the mnemonic phrase
    const encryptedMnemonic = encrypt(mnemonic15);
    const privateKey = wallet.privateKey;
    console.log("privateKey", privateKey)
    const encryptedPrivateKey = encrypt(privateKey);
    // Save wallet data to DB
    await prisma.wallet.create({
      data: {
        userId,
        encryptedPhrase: encryptedMnemonic,
        publicAddress: wallet.address,
        provider: 'bip39',
        hashedPassword: hashedPassword,
        encryptedPrivateKey: encryptedPrivateKey,
      },
    });

    // Update user's password in DB
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: 'Wallet created successfully',
      address: wallet.address,
      mnemonic: mnemonic15, // Show only once!
    });

  } catch (error: any) {
    console.error('Create Wallet Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
