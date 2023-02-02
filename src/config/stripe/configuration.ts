import { registerAs } from '@nestjs/config';
export default registerAs('stripe', () => ({
  secret: process.env.STRIPE_SK,
  publishable: process.env.STRIPE_PK,
}));
