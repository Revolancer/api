import { registerAs } from '@nestjs/config';
export default registerAs('db', () => ({
  host: process.env.DB_POSTGRES_HOST,
  port: process.env.DB_POSTGRES_PORT,
  user: process.env.DB_POSTGRES_USER,
  password: process.env.DB_POSTGRES_PASS,
  db: process.env.DB_POSTGRES_DB,
  synchronise: process.env.DB_POSTGRES_SYNC,
}));
