import { registerAs } from '@nestjs/config';
export default registerAs('auth', () => ({
  jwtSecret: process.env.AUTH_JWT_SECRET_KEY,
}));
