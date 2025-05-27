import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import { generateOtp } from '../utils/generateOtp';
import { generateToken } from '../utils/jwt';
import { sendResetEmail } from '../utils/nodeMailer';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate token and OTP
    const resetToken = generateToken({
      email: user.email,
      id: user.id,
    });

    const otp = generateOtp();
    const otpExpiration = new Date(Date.now() + 10 * 60 * 1000); 

    await prisma.user.update({
      where: { email },
      data: {
        otp,
        otpExpiresAt: otpExpiration,
        // Optionally save resetToken and expiration if using token-based reset
        // resetToken,
        // resetTokenExp: otpExpiration,
      },
    });

    // Send email
    await sendResetEmail(email, resetToken, otp);

    return res.status(200).json({ message: 'Password reset email with OTP has been sent' });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token missing or invalid' });
    }

    const resetToken = authHeader.split(' ')[1];

    // Decode and verify token
    let decoded: any;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const { email } = decoded;
    const { newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.otpVerified) {
      return res.status(403).json({ message: 'OTP verification required before resetting password' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
        otpVerified: false, // reset flag
      },
    });

    return res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};