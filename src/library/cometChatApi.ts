import { CometChatClient } from "./cometChatClient";
import bcrypt from 'bcrypt';
const cometClient = new CometChatClient();

const register = async (email: string, password: string): Promise<any> => {
  try {
    const user = await cometClient.createUser({
      uid: email,
      name: email.split('@')[0] || email,
      metadata: {
        email,
        "@private": {
          password: bcrypt.hashSync(password, 10),
        }
      }
    });
    return user;
  } catch (err: any) {
    console.error(err.response?.data ?? err.message);
    return err;
  }
};

const login = async (email: string, password: string): Promise<any> => {
  try {
    const user = await cometClient.getUser(email);
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
    return err;
  }
};