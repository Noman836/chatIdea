"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailVerification = void 0;
const prismaClient_1 = __importDefault(require("../database/prismaClient"));
const nodeMailer_1 = require("../utils/nodeMailer");
const generateOtp_1 = require("../utils/generateOtp");
const emailVerification = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        const currentUser = await prismaClient_1.default.user.findUnique({ where: { email } });
        if (!currentUser) {
            return res.status(404).json({ message: 'This email does not exist.' });
        }
        const existingInvitation = await prismaClient_1.default.invitation.findUnique({ where: { email } });
        if (existingInvitation) {
            return res.status(400).json({ message: 'User already invited' });
        }
        const otp = (0, generateOtp_1.generateOtp)(); // <-- Call the utility
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        await prismaClient_1.default.user.update({
            where: { email },
            data: {
                otp,
                otpExpiresAt,
            },
        });
        await prismaClient_1.default.invitation.create({ data: { email } });
        await (0, nodeMailer_1.sendEmail)({
            to: email,
            subject: 'Your OTP Code',
            text: `Your One-Time Password (OTP) is: ${otp}\n\nThis OTP is valid for 10 minutes.`,
            html: `
        <p>Your One-Time Password (OTP) is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes and is linked to your email: <strong>${email}</strong></p>
      `,
        });
        return res.status(200).json({ message: 'OTP sent successfully!' });
    }
    catch (error) {
        console.error('Error in email verification:', error);
        return res.status(500).json({ message: 'Server error', error });
    }
};
exports.emailVerification = emailVerification;
