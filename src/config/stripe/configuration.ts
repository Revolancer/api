import { registerAs } from '@nestjs/config';
export default registerAs('stripe', () => ({
  sk: process.env.STRIPE_SK,
  pk: process.env.STRIPE_PK,
}));
