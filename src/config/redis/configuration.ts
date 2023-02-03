import { registerAs } from '@nestjs/config';
export default registerAs('redis', () => ({
  host: process.env.DB_REDIS_HOST,
  port: process.env.DB_REDIS_PORT,
}));
