import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../env.js';
import { getUser, validate } from '../library/inMemoryChatApi.js';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1] || req.cookies['chat-app-token'];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(
      token || '',
      env.JWT_SECRET,
    );
    if (typeof decoded === 'string' || !decoded?.uid) throw new Error('No uid in token');
    
    validate(decoded?.uid).then(validatedUser => {
      if (validatedUser) {
        req.user = validatedUser;
        next();
      } else {
        return res.status(401).json({ message: 'User not exists. Please register' });
      }
    }).catch(err => {
      throw err;
    });
    
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token', error });
  }
}
