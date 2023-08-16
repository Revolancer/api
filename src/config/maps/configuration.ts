import { registerAs } from '@nestjs/config';
export default registerAs('maps', () => ({
  key: process.env.MAPS_KEY,
}));
