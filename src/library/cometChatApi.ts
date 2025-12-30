import { randomUUID } from "node:crypto";
import { CometChatClient, CometChatUser, GetFriendsRequest } from "./cometChatClient.js";
import bcrypt from 'bcrypt';
const cometClient = new CometChatClient();

export const parseUsersListToClient = async (users: CometChatUser[]) => await cometClient.parseUsersList(users);

// #region // * AUTH
export type RegisterResult = 
  | { success: true; user: CometChatUser }
  | { success: false; error: string; code: 'EMAIL_EXISTS' | 'INVALID_DATA' | 'SERVER_ERROR' };

export const register = async (body: {name: string, email: string, password: string}): Promise<RegisterResult> => {
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
    
    if (!response.data) {
      return { success: false, error: 'Failed to create user account', code: 'SERVER_ERROR' };
    }
    
    return { success: true, user: response.data };
  } catch (err: any) {
    console.error(err);
    
    // Check if it's an email already exists error
    if (err.message?.includes('already exists') || err.response?.data?.error?.includes('already exists')) {
      return { success: false, error: 'An account with this email already exists', code: 'EMAIL_EXISTS' };
    }
    
    // Check for validation errors from CometChat API
    if (err.response?.data?.error) {
      return { success: false, error: err.response.data.error, code: 'INVALID_DATA' };
    }
    
    // Generic server error
    return { success: false, error: 'Unable to create account. Please try again later', code: 'SERVER_ERROR' };
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


// #region // * Messages
export const sendMessage = async (uid: string, params: {
  receiverId: string;
  text: string;
}) => {
  try {
    return await cometClient.sendMessage({
      receiver: params.receiverId,
      data: {
        text: params.text,
      }
    }, { onBehalfOf: uid });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}

export const getConversation = async (uid: string, params: {
  contactId: string;
}) => {
  try {
    return await cometClient.getUserMessages(params.contactId, {
      onBehalfOf: uid,
    });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
// #endregion