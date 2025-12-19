import { Router } from 'express';
import { addFriends, searchUsers, getFriends } from '../library/cometChatApi';

const router = Router();

router.post('/', async (req, res) => {
  const body = req.body;

  if (!body) return res.status(400).json({ message: 'Missing body' });
  if (!body.uids) return res.status(400).json({ message: 'Missing uids' });

  const result = await addFriends(req.user.uid, body.uids);

  if (!result) {
    return res.status(400).json({ message: 'Something went wrong' });
  }

  res.json({ message: `Added ${body.uids.length} friends`, res: result?.data?.accepted });
});

router.get('/', async (req, res) => {
  const result = await getFriends(req.user.uid, {
    searchKey: String(req.query['q'] || ''),
    page: Number(req.query['page']) || 1,
    perPage: Number(req.query['perPage']) || 1000,
  });

  if (!result) {
    return res.status(400).json({ message: 'Something went wrong' });
  }

  const contacts = result?.data?.map((user) => {
    return { ...user, email: user.metadata?.email, metadata: undefined };
  });

  res.json({ message: `Got ${contacts?.length} contacts`, contacts });
});

router.get('/find-user', async (req, res) => {
  const users = await searchUsers(String(req.query['q'] || ''));

  if (!users) {
    return res.status(400).json({ message: 'Something went wrong' });
  }

  res.json({
    message: `Got ${users?.length} users`,
    // exclude self from results
    users: users
      .filter((u) => u.uid !== req.user.uid)
      ?.map((user) => {
        return { ...user, email: user.metadata?.email, metadata: undefined };
      }),
  });
});

export default router;
