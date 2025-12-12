import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, migrationClient } from './index';

async function main() {
  console.log('Running migrations...');

  await migrate(db, { migrationsFolder: './src/lib/db/migrations' });

  console.log('Migrations completed!');

  await migrationClient.end();
}

main().catch((err) => {
  console.error('Migration failed!');
  console.error(err);
  process.exit(1);
});
