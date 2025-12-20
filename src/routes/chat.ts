import { Router } from 'express';
import { getConversation, sendMessage } from '../library/cometChatApi';

const chatRouter = Router();

chatRouter.post('/user/{:uid}', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.message) return res.status(400).json({ message: 'Missing message' });
  if (!req.params.uid) return res.status(400).json({ message: 'Missing receiver uid param' });

  const result = await sendMessage(req.user.uid, {
    receiverId: req.params.uid,
    text: body.message
  });

  if (!result) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  res.json({ message: `message is sent to ${body.receiverId}`, res: result?.data });
});

chatRouter.get('/user/{:uid}', async (req, res) => {
  if (!req.params.uid) return res.status(400).json({ message: 'Missing receiver uid param' });

  const result = await getConversation(req.user.uid, {
    contactId: req.params.uid,
  });

  if (!result) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  res.json({ message: `conversation is loaded with ${req.params.uid}`, res: result?.data, pagination: result?.meta?.pagination });
});

export default chatRouter;
