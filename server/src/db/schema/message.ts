import {
  foreignKey,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

import { conversation } from 'db/schema/conversation';

export const message = pgTable(
  'messages',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    parentMessageId: integer(),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversation.id, { onDelete: 'cascade' }),
    role: text({ enum: ['user', 'assistant', 'system'] }).notNull(),
    content: text().notNull(),
    createdAt: timestamp({ mode: 'string', precision: 3, withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: 'fk_message_parent',
      columns: [table.parentMessageId],
      foreignColumns: [table.id],
    })
      .onDelete('no action')
      .onUpdate('cascade'),
  ],
);
