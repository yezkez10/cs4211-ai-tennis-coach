import { defineRelationsPart } from 'drizzle-orm';

import * as schema from 'db/schema';

export const relations = defineRelationsPart(schema, (r) => ({
  user: {
    conversation: r.many.conversation(),
  },
  conversation: {
    user: r.one.user({
      from: r.conversation.userId,
      to: r.user.id,
    }),
    messages: r.many.message(),
  },
  message: {
    conversation: r.one.conversation({
      from: r.message.conversationId,
      to: r.conversation.id,
    }),
  },
}));
