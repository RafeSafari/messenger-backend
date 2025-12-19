import express from 'express';
import cors from 'cors';
import { env } from './env';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import { authMiddleware } from './middleware/auth';
import cookieParser from 'cookie-parser';

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

// ! public routes
app.use('/auth', authRoutes);


app.use(authMiddleware);
// ! protected routes

app.use('/contacts', contactRoutes);

const PORT = env.PORT || 50005;
app.listen(PORT, () => {
  console.clear();
  console.log(`Server running on port ${PORT}\nurl: http://localhost:${PORT}`);
});
