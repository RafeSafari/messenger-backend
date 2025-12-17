// cometchatClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

/**
 * =========
 * CONSTANTS
 * =========
 * In production you should set these via environment variables.
 */

export const COMETCHAT_APP_ID: string = process.env.COMETCHAT_APP_ID ?? '16732397586ed16b8';

export const COMETCHAT_REGION: string = process.env.COMETCHAT_REGION ?? 'eu';

export const COMETCHAT_API_KEY: string = process.env.COMETCHAT_API_KEY ?? 'c7729b4777c7dff07f7f2fd612987ba5588cbe8c';

// Base REST domain for chat APIs
export const COMETCHAT_BASE_URL = `https://${COMETCHAT_APP_ID}.api-${COMETCHAT_REGION}.cometchat.io/v3`;

// Default axios config shared by all requests
export const AXIOS_DEFAULT_CONFIG: AxiosRequestConfig = {
  baseURL: COMETCHAT_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    apikey: COMETCHAT_API_KEY,
  },
};

/**
 * ===========
 * BASIC TYPES
 * ===========
 * These are simplified versions. Extend as needed based on the docs.
 */

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
  metadata?: Record<string, unknown>;
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

  /**
   * =============
   * USER ENDPOINTS
   * =============
   */

  // GET /users
  async listUsers(options: ListUsersOptions = {}): Promise<ApiResponse<CometChatUser[]>> {
    const res = await this.http.get<ApiResponse<CometChatUser[]>>('/users', {
      params: options,
    });
    return res.data;
  }

  // POST /users
  async createUser(payload: CreateUserRequest): Promise<ApiResponse<CometChatUser>> {
    const res = await this.http.post<ApiResponse<CometChatUser>>('/users', payload);
    return res.data;
  }

  // GET /users/{uid}
  async getUser(
    uid: string,
    { onBehalfOf }: { onBehalfOf?: string } = {},
  ): Promise<CometChatUser> {
    const res = await this.http.get<CometChatUser>(
      `/users/${encodeURIComponent(uid)}`,
      buildConfig({ onBehalfOf }),
    );
    return res.data;
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
