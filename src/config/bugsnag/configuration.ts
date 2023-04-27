import { registerAs } from '@nestjs/config';
export default registerAs('bugsnag', () => ({
  key: process.env.BUGSNAG_API_KEY,
}));
