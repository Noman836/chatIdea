import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import {sendEmail }from '../utils/nodeMailer';
import { generateToken } from '../utils/jwt';

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const newUser = await prisma.user.update({
      where: { email },
      data: {
        emailVerified: true,
        otp: null,
        otpVerified: true,
      },
    });
     const token = generateToken(
      user.email || user.email || '',
        user.id || '',
    );
    res.status(200).json({ message: "Email verified successfully", newUser,token });

  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const canResendAt = user.otpExpiresAt
      ? new Date(user.otpExpiresAt.getTime() + 60000) 
      : new Date(0);

    if (now < canResendAt) {
      const secondsRemaining = Math.ceil((canResendAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsRemaining} seconds before requesting a new OTP.`,
      });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString(); 

    await prisma.user.update({
      where: { email },
      data: {
        otp: newOtp,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000), 
      },
    });

    await sendEmail({
      to: email,
      subject: "Your new OTP code",
      html: `<p>Your new OTP is: <strong>${newOtp}</strong></p>
             <p>This OTP is valid for the next few minutes.</p>`,
    });

    res.status(200).json({ message: "A new OTP has been sent to your email."});

  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
