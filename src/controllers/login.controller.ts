import { Request, Response } from 'express';
import prisma from '../database/prismaClient';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username?: string;
    password?:  null;
  };
  file?: Express.Multer.File;
}

export const loginUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !user.password) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
        res.status(401).json({ message: 'Invalid password' });
        return
    }
    
    const token = generateToken({
    email: user.email,
    id: user.id,
    username: user.username || '',
    });

    return res.status(200).json({ message: 'Login successful', user,token });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
