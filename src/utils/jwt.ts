import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (user: { email: string; id: string }) => {
  return jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });
};
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
};