import { registerAs } from '@nestjs/config';
export default registerAs('bugsnag', () => ({
  key: process.env.DB_POSTGRES_HOST,
}));
