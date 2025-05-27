"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetEmail = void 0;
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
/**
 * Send an email with the given configuration.
 * @param {EmailOptions} options - Email configuration options
 * @returns {Promise<nodemailer.SentMessageInfo>} - Email sending result
 */
async function sendEmail({ from = 'no_reply@rechargermonauto.com', to, subject, text, html, }) {
    const mailOptions = {
        from,
        to,
        subject,
        text,
        html,
    };
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Failed to send email:', error);
        throw error;
    }
}
const sendResetEmail = async (email, token, otp) => {
    await transporter.sendMail({
        from: `"Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset',
        html: `<p>You requested to reset your password. Use the following OTP code to proceed:</p>
    <h2>${otp}</h2>`
    });
};
exports.sendResetEmail = sendResetEmail;
