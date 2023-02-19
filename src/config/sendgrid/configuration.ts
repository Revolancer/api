import { registerAs } from '@nestjs/config';
export default registerAs('sendgrid', () => ({
  key: process.env.SENDGRID_KEY,
}));
