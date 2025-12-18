import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { login, register } from '../library/cometChatApi';

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
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: '1d' }
  );

  res.json({ message: 'Successful login', token, user });
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
