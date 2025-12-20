import express from 'express';
import cors from 'cors';
import { env } from './env';
import { authMiddleware } from './middleware/auth';
import cookieParser from 'cookie-parser';
import { createServer } from "http";

import authRouter from './routes/auth';
import contactsRouter from './routes/contacts';
import chatRouter from './routes/chat';
import { initSocket } from "./socket";

const app = express();

// ! middlewares
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

app.get("/", (_, res) => res.send("Server running"));

// ! public routes
app.use('/auth', authRouter);


app.use(authMiddleware);
// ! protected routes

app.use('/contacts', contactsRouter);
app.use('/chat', chatRouter);

const httpServer = createServer(app);
initSocket(httpServer);

const PORT = env.PORT || 50005;
httpServer.listen(PORT, () => {
  console.clear();
  console.log(`Server running on port ${PORT}\nurl: http://localhost:${PORT}`);
});
