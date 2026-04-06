import argon2 from 'argon2';
import { execSync } from 'child_process';

import { db } from 'db';
import { sql } from 'drizzle-orm';
import { user } from 'db/schema';

const users = Array.from({ length: 5 }, (_, i) => ({
  email: `${i + 1}@g.com`,
  password: `123`,
  name: `User ${i + 1}`,
}));

async function seed() {
  console.log('Seeding users...');
  for (const u of users) {
    const hashed = await argon2.hash(u.password);
    await db
      .insert(user)
      .values({ ...u, password: hashed })
      .onConflictDoNothing();
  }

  console.log('Enabling pg_trgm extension...');
  await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

  console.log('Seeding shots...');
  execSync(
    `docker exec -i cs4211_postgres pg_restore -U cs4211_admin -d cs4211 --disable-triggers < src/db/seed/shot.dump`,
    { stdio: 'inherit' },
  );

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
