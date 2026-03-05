import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { authMiddleware } from './middleware/auth.js';
import cookieParser from 'cookie-parser';
import { createServer } from "http";

import authRouter from './routes/auth.js';
import contactsRouter from './routes/contacts.js';
import chatRouter from './routes/chat.js';
import { initSocket } from "./socket.js";
import adminRouter from './routes/admin.js';

import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ! middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (
        origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin.startsWith('https://tedtalk.ir')
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

// ! admin routes
app.use('/api/admin', adminRouter);

// ! public routes
app.use('/api/auth', authRouter);

app.use('/api', authMiddleware);
// ! protected routes

app.use('/api/contacts', contactsRouter);
app.use('/api/chat', chatRouter);

// ! public
app.use(express.static(path.join(__dirname, "public")));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const httpServer = createServer(app);
initSocket(httpServer);

const PORT = env.PORT || 50005;
httpServer.listen(PORT, () => {
  console.clear();
  console.log(`Server running on port ${PORT}\nurl: http://localhost:${PORT}`);
});
