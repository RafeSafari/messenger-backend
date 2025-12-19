import { randomUUID } from "node:crypto";
import { CometChatClient, CometChatUser, GetFriendsRequest } from "./cometChatClient";
import bcrypt from 'bcrypt';
const cometClient = new CometChatClient();

export const parseUsersListToClient = async (users: CometChatUser[]) => await cometClient.parseUsersList(users);

// #region // * AUTH
export const register = async (body: {name: string, email: string, password: string}): Promise<CometChatUser|null> => {
  try {
    const response = await cometClient.createUser({
      uid: randomUUID(),
      name: body.name || body.email.split('@')[0] || body.email,
      metadata: {
        email: body.email,
        "@private": {
          password: bcrypt.hashSync(body.password, 10),
        }
      }
    });
    return response.data || null;
  } catch (err: any) {
    console.error(err);
    return null;
  }
};

export const login = async (email: string, password: string): Promise<CometChatUser|null> => {
  try {
    const user = await cometClient.getCachedUserByEmail(email);
    if (!user) {
      return null;
    } else {
      const valid = await bcrypt.compare(password, user.metadata?.['@private']?.password);
      if (!valid) {
        return null;
      }
    }
    return user;
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
};
// #endregion



// #region // * Friends
export const addFriends = async (uid: string, friendsUid: string[]) => {
  try {
    return await cometClient.addFriend(uid, { accepted: friendsUid, addToConversations: true });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}

export const getFriends = async (uid: string, params: GetFriendsRequest = {}) => {
  try {
    return await cometClient.listFriends(uid, params);
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}

export const searchUsers = async (emailQuery: string) => {
  try {
    return await cometClient.searchInCachedUsers(emailQuery);
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
// #endregion

export const getUser = async (uid: string, params: { uid: string }) => {
  try {
    return await cometClient.getUserById(params.uid, { onBehalfOf: uid });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}