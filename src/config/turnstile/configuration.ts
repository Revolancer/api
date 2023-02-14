import { registerAs } from '@nestjs/config';
export default registerAs('turnstile', () => ({
  secret: process.env.CF_TURNSTILE_PRIVATEKEY,
}));
