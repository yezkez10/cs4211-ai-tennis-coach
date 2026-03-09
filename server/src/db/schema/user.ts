import { integer, pgTable, text } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  password: text().notNull().unique(),
  name: text().notNull(),
});
