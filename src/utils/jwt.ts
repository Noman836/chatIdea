import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtPayload } from 'jsonwebtoken';
dotenv.config();

export const generateToken = (user: { email: string; id: string }) => {
  return jwt.sign({ email: user.email, id: user.id }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });
};
// export const verifyToken = (token: string) => {
//   try {
//     return jwt.verify(token, process.env.JWT_SECRET!);
//   } catch (error) {
//     return null;
//   }
// };

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not defined');

  const decoded = jwt.verify(token, secret);
  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload format');
  }

  return decoded; 
};