import { registerAs } from '@nestjs/config';
export default registerAs('cloud-storage', () => ({
  key: process.env.CLOUD_STORAGE_KEY,
  host: process.env.CLOUD_STORAGE_HOST,
}));
