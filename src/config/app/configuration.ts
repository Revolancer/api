import { registerAs } from '@nestjs/config';
export default registerAs('app', () => ({
  env: process.env.APP_ENV,
  name: process.env.APP_NAME,
  cors_url: process.env.APP_CORS_URL,
  port: process.env.APP_PORT,
}));
