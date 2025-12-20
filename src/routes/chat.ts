import { Router } from 'express';
import { getConversation, sendMessage } from '../library/cometChatApi';
import { sendToUser } from '../socket';

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

  // emit message to the receiver
  if (result?.data?.receiver) {
    const sent = sendToUser(result?.data?.receiver, "text-message", result?.data);
    if (sent) {
      console.log(`Message sent to ${result?.data?.receiver} via socket`);
    } else {
      console.log(`${result?.data?.receiver} is offline`);
    }
  }

  res.json({ message: `message is sent to ${result?.data?.receiver}`, res: result?.data });
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
