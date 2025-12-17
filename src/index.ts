import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

app.get('/protected', (req, res) => {
  res.json({ message: 'Protected route works' });
});

const PORT = process.env.PORT || 50005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}\nenv: ${process.env.NODE_ENV}\ndb: ${process.env.DATABASE_URL}\nurl: http://localhost:${PORT}`);
});
