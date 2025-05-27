import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import { sendEmail } from '../utils/nodeMailer';
import { generateOtp } from '../utils/generateOtp';



export const emailVerification = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    console.log("otp", otp)
   

    // // Find existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    console.log("existingUser", existingUser)
    if (existingUser) {
      // Update OTP for existing user
      await prisma.user.update({
        where: { email },
        data: {
          otp,
          otpExpiresAt,
          emailVerified: false, // Optional, if resetting
        },
      });
    } else {
    //   // Create new user with OTP
      await prisma.user.create({
        data: {
          email,
          otp,
          otpExpiresAt,
          emailVerified: false,
        },
      });
    }

    // // Check if invitation already exists
    const existingInvitation = await prisma.invitation.findUnique({ where: { email } });

    if (!existingInvitation) {
      await prisma.invitation.create({ data: { email } });
    }

    // // Send OTP Email
    await sendEmail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your One-Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
      html: `
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes and is linked to your email: <strong>${email}</strong></p>
      `,
    });

    return res.status(200).json({ message: 'OTP sent successfully!' });
  } catch (error) {
    console.error('Error in email verification:', error);
    return res.status(500).json({ message: 'Server error', error });
  }
};
