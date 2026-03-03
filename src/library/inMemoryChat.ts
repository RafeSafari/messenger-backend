import Fuse from 'fuse.js';
import { randomUUID } from 'node:crypto';
import sumUUIDs from './sumUUIDs';
import { ErrorDetail, ERRORS } from '../types/errors';

// #region // * BASIC TYPES
export interface User {
  uid: string;
  name: string;
  avatar?: string;
  link?: string;
  role?: string;
  status?: string;
  statusMessage?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  [key: string]: unknown;
}

export interface Friend extends User {
  conversationId: string; // sum of both user ids
}

export interface CreateUserRequest {
  uid: string;
  name: string;
  avatar?: string;
  link?: string;
  role?: string;
  statusMessage?: string;
  metadata?: Record<string, any>;
  tags?: string[];
  withAuthToken?: boolean;
}

export interface SendMessageRequest {
  sender: string; // uid or guid
  receiver: string; // uid or guid
  text: string;
}

export interface ChatMessage {
  id: string | number;
  sender: string;
  receiver: string;
  text: string;
  sentAt: number;
}

export interface ListUsersOptions {
  searchKey?: string;
  perPage?: number;
  page?: number;
  status?: string;
  [key: string]: unknown;
}

export interface AddFriendRequest {
  accepted: string[];
}

export interface FriendAcceptanceResult {
  success: boolean;
  message: string;
}

export interface AddFriendResponse {
  accepted: Record<string, FriendAcceptanceResult>;
}

export interface GetFriendsRequest {
  searchKey?: string;
  perPage?: number;
  page?: number;
}

interface ResponseMeta {
  pagination?: {
    total?: number,
    count?: number,
    per_page?: number,
    current_page?: number,
    total_pages?: number
  },
  cursor?: {
    id?: number,
    affix?: string
  }
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ErrorDetail;
  meta?: ResponseMeta;
}
// #endregion

/**
 * Simple typed wrapper around Chat REST APIs.
 */
export class ChatClient {
  // private http: AxiosInstance;

  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY
  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY
  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY
  private USERS: User[] = [];
  private FRIENDS: Record<string, string[]> = {};
  private CHATS: Record<string, ChatMessage[]> = {}; // first param is sum of two user ids
  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY
  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY
  // ! -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY -- MEMORY

  constructor(
    //customAxiosConfig: AxiosRequestConfig = {}
  ) {
    // this.http = axios.create({
    //   ...AXIOS_DEFAULT_CONFIG,
    //   ...customAxiosConfig,
    //   headers: {
    //     ...(AXIOS_DEFAULT_CONFIG.headers ?? {}),
    //     ...(customAxiosConfig.headers ?? {}),
    //   },
    // });
  }

  private getUsers(): User[] {
    return this.USERS;
  }

  async parseUsersList(users: User[]) {
    return users.map((user) => ({
      ...user,
      email: user.metadata?.email,
      metadata: undefined,
    }));
  }

  // GET /users
  listUsers(options: ListUsersOptions = {}): User[] {
    return this.USERS;
    // TODO: filter by options
  }

  // POST /users
  createUser(payload: CreateUserRequest): User {
    if (payload.metadata?.email) {
      const cachedUser = this.getCachedUserByEmail(payload.metadata.email);
      if (cachedUser) {
        throw new Error(`User with email ${payload.metadata.email} already exists`);
      }
    }
    const newUser = {
      ...payload,
      uid: payload.uid || randomUUID(),
    }
    this.USERS.push(newUser);
    return newUser;
  }

  // GET /users/{uid}
  getUserById(
    uid: string,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): User | Friend | undefined {
    // const res = await this.http.get<User>(
    //   `/users/${encodeURIComponent(uid)}`,
    //   buildConfig({ onBehalfOf }),
    // );
    const foundUser = this.getUsers().find(user => user.uid === uid);
    if (!foundUser) return foundUser;
    return {
      ...foundUser,
      // conversationId: sumUUIDs(uid, onBehalfOf || ''),
    }
  }

  getCachedUserByEmail(email: string): User | undefined {
    const cachedUsers = this.getUsers();
    return cachedUsers.find((u) => u.metadata?.email === email);
  }

  searchInCachedUsers(emailQuery: string): User[] | undefined {
    const cachedUsers = this.getUsers();
    const fuse = new Fuse(cachedUsers, {
      keys: [
        'name',
        'metadata.email'
      ],
      threshold: 0.3,
      includeScore: true
    });
    const results = fuse.search(emailQuery);
    const sorted = results.map(r => r.item);
    return sorted;
  }

  // POST /users/{uid}/friends
  addFriend(
    uid: string,
    payload: AddFriendRequest,
  ): ApiResponse<AddFriendResponse> {
    const res: AddFriendResponse = { accepted: {} };
    for (const firendUid of payload.accepted) {
      // let error;

      if (!this.getUserById(firendUid)) {
        continue;
      }

      if (this.FRIENDS[uid]) {
        if (this.FRIENDS[uid].indexOf(firendUid) >= 0) {
          console.log(`search ${firendUid} in ${uid} friend list`, this.FRIENDS[uid])
          throw new Error("Already in friends", { cause: ERRORS.ALREADY_IN_FRIENDS });
          // error = ERRORS.ALREADY_IN_FRIENDS;
        } else {
          this.FRIENDS[uid].push(firendUid);
        }
      } else {
        this.FRIENDS[uid] = [firendUid];
      }

      if (this.FRIENDS[firendUid]) {
        if (this.FRIENDS[firendUid].indexOf(uid) >= 0) {
          console.log(`search ${uid} in ${firendUid} friend list`, this.FRIENDS[firendUid])
          throw new Error("Already in friends", { cause: ERRORS.ALREADY_IN_FRIENDS });
          // error = ERRORS.ALREADY_IN_FRIENDS;
        } else {
          this.FRIENDS[firendUid].push(uid);
        }
      } else {
        this.FRIENDS[firendUid] = [uid];
      }

      // if (error === ERRORS.ALREADY_IN_FRIENDS) {
      //   throw new Error("Already in friends", { cause: ERRORS.ALREADY_IN_FRIENDS });
      // }

      res.accepted[firendUid] = {
        message: 'accepted',
        success: true,
      };
    }

    return { data: res };
  }

  // GET /users/{uid}/friends
  listFriends(
    uid: string,
    payload: GetFriendsRequest,
  ): ApiResponse<Friend[]> {
    const friendIDs = this.FRIENDS[uid] || [];
    const friends: Friend[] = [];
    for (const friendID of friendIDs) {
      const friend = this.getUsers().find(user => user.uid === friendID);
      // TODO: filter by payload
      if (friend) {
        const chatId = sumUUIDs(uid, friend.uid);
        friends.push({
          ...friend,
          conversationId: chatId,
        });
      }
    }
    return { data: friends };
  }

  // POST /messages
  sendMessage(messagePayload: SendMessageRequest): ApiResponse<ChatMessage> {
    // const res = await this.http.post<ApiResponse<ChatMessage>>(
    //   '/messages',
    //   {
    //     receiverType: ReceiverType.User,
    //     category: MessageCategory.Message,
    //     type: MessageType.text,
    //     ...messagePayload,
    //   },
    //   buildConfig({ onBehalfOf }),
    // );

    const chatId = sumUUIDs(messagePayload.sender, messagePayload.receiver);

    const message = {
      ...messagePayload,
      id: randomUUID(),
      sentAt: Date.now(),
    };

    if (!this.CHATS[chatId]) this.CHATS[chatId] = [];
    else {
      this.CHATS[chatId].push(message);
    }
    
    return { data: message };
  }

  // GET /users/{uid}/messages
  getUserMessages(uid: string, contactId: string): ApiResponse<ChatMessage[]> {
    // const res = await this.http.get<ApiResponse<any[]>>(
    //   `/users/${encodeURIComponent(uid)}/messages`,
    //   buildConfig({ onBehalfOf }),
    // );

    const chatId = sumUUIDs(uid, contactId);

    if (!this.CHATS[chatId]) {
      throw new Error("chat not found", { cause: ERRORS.CHAT_NOT_FOUND });
    }

    return { data: this.CHATS[chatId] || [] };
  }


  // ! ADMIN
  // GET /admin/users
  adminListUsers(): ApiResponse<User[]> {
    return { data: this.getUsers() }
  }
  // GET /admin/relations
  adminListAllFriendships(): ApiResponse<Record<string, string[]>> {
    return { data: this.FRIENDS }
  }
  // GET /admin/chats
  adminListAllChatMessages(): ApiResponse<Record<string, ChatMessage[]>> {
    return { data: this.CHATS }
  }
}
