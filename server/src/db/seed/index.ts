import argon2 from 'argon2';

import { db } from 'db';
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

  console.log('Done.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
