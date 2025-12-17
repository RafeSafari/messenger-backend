import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const router = Router();

// Fake in-memory user
const user = {
  id: '1',
  email: 'rafe@test.com',
  passwordHash: bcrypt.hashSync('123', 10),
};

router.post('/login', async (req, res) => {
  const body = req.body;

  if (!body) {
    return res.status(400).json({ message: 'Missing body' });
  }

  if (body.email !== user.email) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(body.password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET as string,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

export default router;
