import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

import { conversation } from 'db/schema/conversation';

export const message = pgTable('messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  conversationId: integer('conversation_id')
    .notNull()
    .references(() => conversation.id, { onDelete: 'cascade' }),
  role: text({ enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text().notNull(),
  createdAt: timestamp({ mode: 'string', precision: 3, withTimezone: true })
    .notNull()
    .defaultNow(),
});
