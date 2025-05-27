import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const generateToken = (email: string, id: string) => {
  return jwt.sign({ email, id }, process.env.JWT_SECRET!, {
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