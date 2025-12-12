import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const config = {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
};

export default config;
