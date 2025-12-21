import { Router } from 'express';
import { addFriends, searchUsers, getFriends, parseUsersListToClient, getUser } from '../library/cometChatApi';
import { sendToUser } from '../socket';

const contactsRouter = Router();

contactsRouter.post('/', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.uid) return res.status(400).json({ message: 'Missing uid' });

  const result = await addFriends(req.user.uid, [body.uid]);

  if (!result) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  if (!result?.data?.accepted?.[body.uid]?.success) {
    return res.status(500).json({ message: 'Failed to add contact' });
  }
  
  // emit contact add to the target
  if (body.uid) {
    const sent = sendToUser(body.uid, "new-contact", req.user.uid);
    if (sent) {
      console.log(`Contact add trigger sent to ${body.uid} via socket`);
    } else {
      console.log(`${body.uid} is offline`);
    }
  }

  res.json({ message: `Added ${body.uid} to friends`, res: result?.data?.accepted });
});

contactsRouter.get('/', async (req, res) => {
  const result = await getFriends(req.user.uid, {
    searchKey: String(req.query['q'] || ''),
    page: Number(req.query['page']) || 1,
    perPage: Number(req.query['perPage']) || 1000,
  });

  if (!result) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  const contacts = await parseUsersListToClient(result?.data || []);

  res.json({
    message: `Got ${contacts?.length} contacts`,
    contacts,
  });
});

contactsRouter.get('/find-user', async (req, res) => {
  const users = await searchUsers(String(req.query['q'] || ''));

  if (!users) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  const parsedUsers = await parseUsersListToClient(users.filter((u) => u.uid !== req.user.uid));

  res.json({
    message: `Got ${users?.length} users`,
    // exclude self from results
    users: parsedUsers,
  });
});

contactsRouter.get('/{:uid}', async (req, res) => {
  if (!req.params['uid']) return res.status(400).json({ message: 'Missing uid' });

  const result = await getUser(req.user.uid, { uid: req.params['uid'] });

  if (!result) {
    return res.status(500).json({ message: 'Something went wrong' });
  }

  const parsed = (await parseUsersListToClient([result]))[0];

  res.json({
    message: `Got "${parsed?.name}"`,
    user: parsed,
  });
});

export default contactsRouter;
