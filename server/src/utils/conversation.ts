import dayjs from 'dayjs';
import { type ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { z } from 'zod';

export const SchemaMessageValidator = z.object({
  id: z.number(),
  createdAt: z.string(),
  role: z.string(),
  content: z.string(),
  parentMessageId: z.number().nullable(),
});

type SchemaMessage = z.infer<typeof SchemaMessageValidator>;

export function buildConversationForUi(
  messages: SchemaMessage[],
  currentMessageId: number | null = null,
): SchemaMessage[] {
  if (messages.length === 0) return [];

  const messageMap = new Map(messages.map((m) => [m.id, m]));

  const startId =
    currentMessageId ??
    messages.reduce((prev, curr) =>
      dayjs(prev.createdAt).isAfter(curr.createdAt) ? prev : curr,
    ).id;

  const thread: SchemaMessage[] = [];
  for (
    let id: number | null = startId;
    id;
    id = messageMap.get(id)?.parentMessageId ?? null
  ) {
    const msg = messageMap.get(id);
    if (!msg) break;
    thread.push(msg);
  }

  return thread.reverse();
}

export function buildConversationForAi(
  messages: SchemaMessage[],
  currentMessageId: number | null,
): ChatCompletionMessageParam[] {
  return buildConversationForUi(messages, currentMessageId)
    .filter((m) => m.content.trim())
    .map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));
}
