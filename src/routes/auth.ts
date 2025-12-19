import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { login, register } from '../library/cometChatApi';
import { env } from '../env';

const router = Router();

router.post('/login', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.email) return res.status(400).json({ message: 'Missing email' });
  if (!body.password) return res.status(400).json({ message: 'Missing password' });

  const user = await login(body.email, body.password);

  if (!user) {
    return res.status(401).json({ message: 'Username or password is incorrect' });
  }

  const token = jwt.sign(
    { uid: user.uid, name: user.name, email: user.metadata?.email },
    env.JWT_SECRET,
    { expiresIn: '1d' }
  );

  res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  res.json({ message: "Successful login", user });
});

router.post('/register', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.name) return res.status(400).json({ message: 'Missing name' });
  if (!body.email) return res.status(400).json({ message: 'Missing email' });
  if (!body.password) return res.status(400).json({ message: 'Missing password' });

  const user = await register(body);

  if (!user) {
    return res.status(400).json({ message: 'Already registered' });
  }

  // const token = jwt.sign(
  //   { userId: user.id },
  //   process.env.JWT_SECRET as string,
  //   { expiresIn: '1d' }
  // );

  res.json({ message: 'User registered', user });
});

export default router;
