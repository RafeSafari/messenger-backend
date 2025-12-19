import Fuse from 'fuse.js';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { env } from '../env';

// Default axios config
export const AXIOS_DEFAULT_CONFIG: AxiosRequestConfig = {
  baseURL: `https://${env.COMETCHAT_APP_ID}.api-${env.COMETCHAT_REGION}.cometchat.io/v3`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    apikey: env.COMETCHAT_API_KEY,
  },
};

// #region // * BASIC TYPES
export interface CometChatUser {
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

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'uid'>>;

export type ReceiverType = 'user' | 'group';

export type MessageCategory = 'message' | 'custom' | 'interactive';

export interface MessageData {
  text?: string;
  [key: string]: unknown;
}

export interface SendMessageRequest {
  receiver: string; // uid or guid
  receiverType: ReceiverType;
  category: MessageCategory;
  type: string; // 'text' | 'image' | etc.
  data: MessageData;
  [key: string]: unknown;
}

export interface CometChatMessage {
  id: string | number;
  receiver: string;
  receiverType: ReceiverType;
  sender: string;
  category: MessageCategory;
  type: string;
  data: MessageData;
  sentAt: number;
  [key: string]: unknown;
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
  addToConversations?: boolean;
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

export interface ListMessagesOptions {
  onBehalfOf?: string;
  limit?: number;
  conversationId?: string;
  sender?: string;
  receiver?: string;
  receiverType?: ReceiverType;
  category?: MessageCategory;
  type?: string;
  [key: string]: unknown;
}

export interface ListUserMessagesOptions {
  onBehalfOf?: string;
  limit?: number;
  // other query params, e.g. { messageId, timestamp, etc. }
  [key: string]: unknown;
}

export interface Conversation {
  conversationId: string;
  lastMessage?: CometChatMessage;
  unreadMessageCount?: number;
  [key: string]: unknown;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  [key: string]: unknown;
}
// #endregion

/**
 * Small helper to merge onBehalfOf header and query params when provided.
 */
function buildConfig({
  onBehalfOf,
  params,
}: {
  onBehalfOf?: string;
  params?: Record<string, unknown>;
} = {}): AxiosRequestConfig {
  const config: AxiosRequestConfig = {};
  if (params) config.params = params;
  if (onBehalfOf) {
    config.headers = {
      ...(AXIOS_DEFAULT_CONFIG.headers ?? {}),
      onBehalfOf,
    };
  }
  return config;
}

/**
 * Simple typed wrapper around CometChat REST APIs.
 */
export class CometChatClient {
  private http: AxiosInstance;
  private CACHED_USERS: CometChatUser[] = [];
  private CACHED_USERS_INITIALIZED = false;

  constructor(customAxiosConfig: AxiosRequestConfig = {}) {
    this.http = axios.create({
      ...AXIOS_DEFAULT_CONFIG,
      ...customAxiosConfig,
      headers: {
        ...(AXIOS_DEFAULT_CONFIG.headers ?? {}),
        ...(customAxiosConfig.headers ?? {}),
      },
    });
  }

  private async getCachedUsers(): Promise<CometChatUser[]> {
    if (this.CACHED_USERS_INITIALIZED) return this.CACHED_USERS;
    this.CACHED_USERS = (await this.listUsers({ perPage: 1000 })).data || [];
    this.CACHED_USERS_INITIALIZED = true;
    return this.CACHED_USERS;
  }

  async parseUsersList(users: CometChatUser[]) {
    // const cached = await this.getCachedUsers();
    return users.map((user) => ({
      // ...cached.find((u) => u.uid === user.uid),
      ...user,
      email: user.metadata?.email,
      metadata: undefined,
    }));
  }

  // GET /users
  async listUsers(options: ListUsersOptions = {}): Promise<ApiResponse<CometChatUser[]>> {
    const res = await this.http.get<ApiResponse<CometChatUser[]>>('/users', {
      params: options,
    });
    return res.data;
  }

  // POST /users
  async createUser(payload: CreateUserRequest): Promise<ApiResponse<CometChatUser>> {
    if (payload.metadata?.email) {
      const cachedUser = await this.getCachedUserByEmail(payload.metadata.email);
      if (cachedUser) {
        throw new Error(`User with email ${payload.metadata.email} already exists`);
      }
    }
    const res = await this.http.post<ApiResponse<CometChatUser>>('/users', payload);
    if (res.data.data) this.CACHED_USERS.push(res.data.data);
    return res.data;
  }

  // GET /users/{uid}
  async getUserById(
    uid: string,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<CometChatUser> {
    const res = await this.http.get<CometChatUser>(
      `/users/${encodeURIComponent(uid)}`,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  async getCachedUserByEmail(email: string): Promise<CometChatUser | undefined> {
    const cachedUsers = await this.getCachedUsers();
    return cachedUsers.find((u) => u.metadata?.email === email);
  }

  // POST /users/{uid}/friends
  async addFriend(
    uid: string,
    payload: AddFriendRequest,
  ): Promise<ApiResponse<AddFriendResponse>> {
    const res = await this.http.post<ApiResponse<AddFriendResponse>>(
      `/users/${encodeURIComponent(uid)}/friends`,
      {
        ...payload,
        addToConversations: payload.addToConversations ?? true,
      },
      buildConfig(),
    );
    return res.data;
  }

  // GET /users/{uid}/friends
  async listFriends(
    uid: string,
    payload: GetFriendsRequest,
  ): Promise<ApiResponse<CometChatUser[]>> {
    if (!payload.searchKey) delete payload.searchKey;
    const res = await this.http.get<ApiResponse<CometChatUser[]>>(
      `/users/${encodeURIComponent(uid)}/friends`,
      buildConfig({
        params: {
          ...payload,
        },
      })
    );
    return res.data;
  }

  // async findCachedUsersByEmail(emailQuery: string): Promise<CometChatUser[] | undefined> {
  //   const cachedUsers = await this.getCachedUsers();
  //   const weighted = cachedUsers.map((u) => ({
  //     ...u,
  //     similarity: similarity(u.metadata?.email || '', emailQuery),
  //   })).filter((u) => u.similarity > 0);
  //   const sorted = weighted.sort((a, b) => b.similarity - a.similarity);
  //   return sorted;
  // }

  async searchInCachedUsers(emailQuery: string): Promise<CometChatUser[] | undefined> {
    const cachedUsers = await this.getCachedUsers();
    const fuse = new Fuse(cachedUsers, {
      keys: [
        'name',
        'metadata.email'
      ],
      threshold: 0.3,
      includeScore: true
    });
    const results = fuse.search(emailQuery);
    // console.log(results.map(u => ({ name: u.item.name, email: u.item.metadata?.email, score: u.score })));
    const sorted = results.map(r => r.item);
    return sorted;
  }














  // PUT /users/{uid}
  async updateUser(
    uid: string,
    payload: UpdateUserRequest,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse<CometChatUser>> {
    const res = await this.http.put<ApiResponse<CometChatUser>>(
      `/users/${encodeURIComponent(uid)}`,
      payload,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  /**
   * ==============
   * MESSAGE APIS
   * ==============
   */

  // POST /messages
  async sendMessage(
    messagePayload: SendMessageRequest,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse<CometChatMessage>> {
    const res = await this.http.post<ApiResponse<CometChatMessage>>(
      '/messages',
      messagePayload,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  // GET /messages (global list)
  async listMessages(
    options: ListMessagesOptions = {},
  ): Promise<ApiResponse<CometChatMessage[]>> {
    const { onBehalfOf, ...params } = options;
    const res = await this.http.get<ApiResponse<CometChatMessage[]>>(
      '/messages',
      buildConfig({ onBehalfOf, params }),
    );
    return res.data;
  }

  /**
   * ===================
   * USER MESSAGES / CONVERSATIONS
   * ===================
   */

  // GET /users/{uid}/messages
  async listUserMessages(
    uid: string,
    options: ListUserMessagesOptions = {},
  ): Promise<ApiResponse<CometChatMessage[]>> {
    const { onBehalfOf, ...params } = options;
    const res = await this.http.get<ApiResponse<CometChatMessage[]>>(
      `/users/${encodeURIComponent(uid)}/messages`,
      buildConfig({ onBehalfOf, params }),
    );
    return res.data;
  }

  // GET /users/{uid}/conversation
  async getUserConversation(
    uid: string,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse<Conversation>> {
    const res = await this.http.get<ApiResponse<Conversation>>(
      `/users/${encodeURIComponent(uid)}/conversation`,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  // POST /users/{uid}/conversation/read
  async markUserConversationRead(
    uid: string,
    messageId: string | number,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse> {
    const body = { messageId };
    const res = await this.http.post<ApiResponse>(
      `/users/${encodeURIComponent(uid)}/conversation/read`,
      body,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  // DELETE /users/{uid}/conversation/read (optional extra)
  async markUserConversationUnread(
    uid: string,
    messageId: string | number,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse> {
    const body = { messageId };
    const res = await this.http.delete<ApiResponse>(
      `/users/${encodeURIComponent(uid)}/conversation/read`,
      {
        ...buildConfig({ onBehalfOf }),
        data: body, // axios uses `data` for DELETE body
      },
    );
    return res.data;
  }

  /**
   * ===================
   * GROUP CONVERSATION HELPERS (OPTIONAL)
   * ===================
   */

  // POST /groups/{guid}/conversation/read
  async markGroupConversationRead(
    guid: string,
    messageId: string | number,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse> {
    const body = { messageId };
    const res = await this.http.post<ApiResponse>(
      `/groups/${encodeURIComponent(guid)}/conversation/read`,
      body,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
  }

  // DELETE /groups/{guid}/conversation/read
  async markGroupConversationUnread(
    guid: string,
    messageId: string | number,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<ApiResponse> {
    const body = { messageId };
    const res = await this.http.delete<ApiResponse>(
      `/groups/${encodeURIComponent(guid)}/conversation/read`,
      {
        ...buildConfig({ onBehalfOf }),
        data: body,
      },
    );
    return res.data;
  }
}
