import { Router } from 'express';
import { getAllUsers, getAllRelations, getAllMessages } from '../library/inMemoryChatApi.js';

const adminRouter = Router();

adminRouter.get('/db', async (req, res) => {
  const users = await getAllUsers();
  const relations = await getAllRelations();
  const chats = await getAllMessages();
  res.json({
    users,
    relations,
    chats
  });
});

adminRouter.get('/users', async (req, res) => {
  const result = await getAllUsers();
  res.json(result);
});

adminRouter.get('/relations', async (req, res) => {
  const result = await getAllRelations();
  res.json(result);
});

adminRouter.get('/chats', async (req, res) => {
  const result = await getAllMessages();
  res.json(result);
});


export default adminRouter;
