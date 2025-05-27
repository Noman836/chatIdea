import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthRequest extends Request {
  user?: any;
}
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('noman', authHeader);
    if (!authHeader) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decode = jwt.verify(token, process.env.JWT_SECRET!);
    (req as AuthRequest).user = decode;
    next();
  } catch (error) {
    res.status(401).json({ error: 'error in auth middleware' });
    return;
  }
};
