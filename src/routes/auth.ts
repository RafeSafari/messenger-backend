import { Router } from 'express';
import jwt from 'jsonwebtoken';
// import { login, parseUsersListToClient, register } from '../library/cometChatApi.js';
import { login, parseUsersListToClient, register } from '../library/inMemoryChatApi.js';
import { env } from '../env.js';

const authRouter = Router();

const createToken = (uid: string, name: string, email: string) => jwt.sign({ uid, name, email }, env.JWT_SECRET, { expiresIn: '1d' });

authRouter.post('/login', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.email) return res.status(400).json({ message: 'Missing email' });
  if (!body.password) return res.status(400).json({ message: 'Missing password' });

  const user = await login(body.email, body.password);

  if (!user) {
    return res.status(401).json({ message: 'Username or password is incorrect' });
  }

  const token = createToken(user.uid, user.name, user.metadata?.email);
  res.cookie('chat-app-token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });

  const parsed = (await parseUsersListToClient([user]))[0];
  res.json({ message: "Successful login", user: parsed });
});

authRouter.post('/register', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.name) return res.status(400).json({ message: 'Missing name' });
  if (!body.email) return res.status(400).json({ message: 'Missing email' });
  if (!body.password) return res.status(400).json({ message: 'Missing password' });

  const result = await register(body);

  if (!result.success) {
    const statusCode = result.code === 'EMAIL_EXISTS' ? 409 : result.code === 'INVALID_DATA' ? 400 : 500;
    return res.status(statusCode).json({ 
      message: result.error,
      code: result.code
    });
  }

  const token = createToken(result.user.uid, result.user.name, result.user.metadata?.email);
  res.cookie('chat-app-token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  
  const parsed = (await parseUsersListToClient([result.user]))[0];
  res.json({ message: 'User registered successfully', user: parsed });
});

authRouter.get('/logout', async (req, res) => {
  res.clearCookie('chat-app-token', { httpOnly: true, secure: false, sameSite: 'lax', path: '/' });
  res.json({ message: "Successful logout" });
});

export default authRouter;
