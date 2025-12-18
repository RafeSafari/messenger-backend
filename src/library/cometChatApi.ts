import { randomUUID } from "node:crypto";
import { CometChatClient, CometChatUser } from "./cometChatClient";
import bcrypt from 'bcrypt';
const cometClient = new CometChatClient();

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