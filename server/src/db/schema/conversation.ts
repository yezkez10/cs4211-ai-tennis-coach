import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from 'db/schema/user';

export const conversation = pgTable('conversation', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text(),
  createdAt: timestamp().defaultNow().notNull(),
});
