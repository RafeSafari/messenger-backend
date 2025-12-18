import 'dotenv/config';

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 50005),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  COMETCHAT_APP_ID: requireEnv('COMETCHAT_APP_ID'),
  COMETCHAT_REGION: requireEnv('COMETCHAT_REGION'),
  COMETCHAT_API_KEY: requireEnv('COMETCHAT_API_KEY'),
};
