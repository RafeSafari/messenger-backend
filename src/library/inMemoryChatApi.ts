import { randomUUID } from "node:crypto";
import { ChatClient, User, GetFriendsRequest } from "./inMemoryChat";
import bcrypt from 'bcrypt';
import { ERRORS, getErrorDetails } from "../types/errors";
const instance = new ChatClient();

export const parseUsersListToClient = async (users: User[]) => await instance.parseUsersList(users);

// #region // * AUTH
export type RegisterResult = 
  | { success: true; user: User }
  | { success: false; error: string; code: 'EMAIL_EXISTS' | 'INVALID_DATA' | 'SERVER_ERROR' };

export const register = (body: {name: string, email: string, password: string}): RegisterResult => {
  try {
    const response = instance.createUser({
      uid: randomUUID(),
      name: body.name || body.email.split('@')[0] || body.email,
      metadata: {
        email: body.email,
        "@private": {
          password: bcrypt.hashSync(body.password, 10),
        }
      }
    });
    
    if (!response) {
      return { success: false, error: 'Failed to create user account', code: 'SERVER_ERROR' };
    }
    
    return { success: true, user: response };
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

export const login = async (email: string, password: string): Promise<User|null> => {
  try {
    const user = instance.getCachedUserByEmail(email);
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

export const validate = async (uid: string): Promise<User|null> => {
  try {
    const user = instance.getUserById(uid);
    if (!user) {
      return null;
    }
    return user;
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
// #endregion



// #region // * Friends
export const addFriends = (uid: string, friendsUid: string[]) => {
  try {
    return instance.addFriend(uid, { accepted: friendsUid });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    if (!isNaN(err?.cause)) {
      return { error: getErrorDetails(err?.cause)};
    }
    return null;
  }
}

export const getFriends = (uid: string, params: GetFriendsRequest = {}) => {
  try {
    return instance.listFriends(uid, params);
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}

export const searchUsers = (emailQuery: string) => {
  try {
    return instance.searchInCachedUsers(emailQuery);
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
// #endregion

export const getUser = (uid: string, params: { uid: string }) => {
  try {
    return instance.getUserById(params.uid, { onBehalfOf: uid });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}


// #region // * Messages
export const sendMessage = (uid: string, params: {
  receiverId: string;
  text: string;
}) => {
  try {
    return instance.sendMessage({
      sender: uid,
      receiver: params.receiverId,
      text: params.text,
    });
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}

export const getConversation = (uid: string, params: {
  contactId: string;
}) => {
  try {
    return instance.getUserMessages(uid, params.contactId);
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    if (!isNaN(err?.cause)) {
      return { error: getErrorDetails(err?.cause)};
    }
    return null;
  }
}
// #endregion


// #region // ! Admin
export const getAllUsers = () => {
  try {
    return instance.adminListUsers();
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
export const getAllRelations = () => {
  try {
    return instance.adminListAllFriendships();
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
export const getAllMessages = () => {
  try {
    return instance.adminListAllChatMessages();
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return null;
  }
}
// #endregion