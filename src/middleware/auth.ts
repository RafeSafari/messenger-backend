import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies['chat-app-token'];
  if (!token) {
    console.log(req.url, 'chat-app-token', req.cookies['chat-app-token'])
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
      token || '',
      env.JWT_SECRET,
    );
    if (typeof decoded !== 'string' && !decoded?.uid) throw new Error('No uid in token');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error });
  }
}
