import 'dotenv/config';

const loadEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

export const env = {
  PORT: Number(process.env.PORT ?? 50005),
  JWT_SECRET: loadEnv('JWT_SECRET'),
  COMETCHAT_APP_ID: loadEnv('COMETCHAT_APP_ID'),
  COMETCHAT_REGION: loadEnv('COMETCHAT_REGION'),
  COMETCHAT_API_KEY: loadEnv('COMETCHAT_API_KEY'),
};
