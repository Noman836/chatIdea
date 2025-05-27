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
    const otpExpiresAt = new Date(Date.now() + 50 * 60 * 1000); // 10 minutes
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
    const otpLastSent = user.otpExpiresAt ? new Date(user.otpExpiresAt.getTime() - 10 * 60 * 1000) : new Date(0);
    // Explanation:
    // If you store only otpExpiresAt, to get the time when OTP was sent, you subtract validity time (10 min here).
    // If you have separate field for lastSentAt, use that instead (better).

    // OR better, if you add otpLastSentAt to user schema, then:
    // const otpLastSent = user.otpLastSentAt || new Date(0);

    // Calculate when next OTP can be sent (60 seconds after last sent)
    const canResendAt = new Date(otpLastSent.getTime() + 60 * 1000);

    if (now < canResendAt) {
      const secondsRemaining = Math.ceil((canResendAt.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        message: `Please wait ${secondsRemaining} seconds before requesting a new OTP.`,
      });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save new OTP, update expiry, and update lastSent time
    await prisma.user.update({
      where: { email },
      data: {
        otp: newOtp,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),  // OTP valid for 10 minutes
        otpLastSentAt: new Date(), // store the time OTP was sent
      },
    });

    await sendEmail({
      to: email,
      subject: "Your new OTP code",
      html: `<p>Your new OTP is: <strong>${newOtp}</strong></p>
             <p>This OTP is valid for the next 10 minutes.</p>`,
    });

    return res.status(200).json({ message: "A new OTP has been sent to your email." });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
