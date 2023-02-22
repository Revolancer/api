import { registerAs } from '@nestjs/config';
export default registerAs('chargebee', () => ({
  key: process.env.CHARGEBEE_KEY,
  site: process.env.CHARGEBEE_SITE,
}));
