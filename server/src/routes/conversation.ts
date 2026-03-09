import { CREATE_TITLE_PROMPT, createOpenAi } from 'ai';
import { and, eq } from 'drizzle-orm';
import { type Env, Hono, type Context as HonoContext, type Input } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { streamSSE } from 'hono/streaming';
import {
  type ChatCompletionChunk,
  type ChatCompletionMessageParam,
  type ChatModel,
} from 'openai/resources';
import { tools } from 'tools';
import { z } from 'zod';

import { db } from 'db';
import { conversation, message } from 'db/schema';

import { authMiddleware } from 'middlewares/auth';
import { zodValidator } from 'middlewares/zodValidator';

import {
  buildConversationForAi,
  buildConversationForUi,
} from 'utils/conversation';
import { takeFirstOrThrow, takeUniqueOrThrow } from 'utils/db';

const DEFAULT_CONVERSATION_TITLE = 'New Chat';
const OPEN_AI_MODEL: ChatModel = 'gpt-4.1-nano';

const toolSchemas = tools.map((t) => t.schema);
const toolMap = Object.fromEntries(
  tools.map((t) => [t.schema.function.name, t]),
);

export const converstationApp = new Hono()
  .get('/', authMiddleware(), async (c) => {
    const { userId } = c.var.userJwtPayload;

    const conversations = await db.query.conversation.findMany({
      where: { userId },
      columns: { id: true, title: true, createdAt: true },
      orderBy: (t, { desc }) => desc(t.createdAt),
    });

    return c.json({ data: conversations });
  })
  .get(
    '/:conversationId',
    authMiddleware(),
    zodValidator(
      'param',
      z.object({ conversationId: z.coerce.number().int() }),
    ),
    async (c) => {
      const { userId } = c.var.userJwtPayload;
      const { conversationId } = c.req.valid('param');

      const conversationData = await db.query.conversation.findFirst({
        where: { id: conversationId, userId },
        with: {
          messages: {
            columns: {
              id: true,
              role: true,
              content: true,
              createdAt: true,
              parentMessageId: true,
            },
          },
        },
      });

      if (!conversationData) {
        throw new HTTPException(404, { message: 'Conversation not found' });
      }

      return c.json({
        data: buildConversationForUi(conversationData.messages, null),
      });
    },
  )
  .delete(
    '/:id',
    authMiddleware(),
    zodValidator('param', z.object({ id: z.coerce.number().int() })),
    async (c) => {
      const { userId } = c.var.userJwtPayload;
      const { id: conversationId } = c.req.valid('param');

      await db
        .delete(conversation)
        .where(
          and(
            eq(conversation.id, conversationId),
            eq(conversation.userId, userId),
          ),
        );

      return c.json({});
    },
  )
  .post(
    '/',
    authMiddleware(),
    zodValidator(
      'json',
      z.object({
        content: z.string().min(1),
        conversationId: z.coerce.number().int().nullable(),
        parentMessageId: z.coerce.number().int().nullable(),
      }),
    ),
    async (c) => {
      const { userId } = c.var.userJwtPayload;
      const { content, parentMessageId, conversationId } = c.req.valid('json');

      let finalConversationId = conversationId;
      if (!finalConversationId) {
        const newConversation = await db
          .insert(conversation)
          .values({ userId, title: DEFAULT_CONVERSATION_TITLE })
          .returning({ id: conversation.id })
          .then(takeUniqueOrThrow);
        finalConversationId = newConversation.id;
      } else {
        const conversationData = await db.query.conversation.findFirst({
          where: { id: finalConversationId, userId },
        });
        if (!conversationData) {
          throw new HTTPException(404, { message: 'Conversation not found' });
        }
      }

      const controller = new AbortController();
      const openAi = createOpenAi(controller.signal);
      c.req.raw.signal.addEventListener('abort', () => controller.abort());

      const newUserMessage = await db
        .insert(message)
        .values({
          role: 'user',
          parentMessageId,
          conversationId: finalConversationId,
          content,
        })
        .returning({ id: message.id })
        .then(takeUniqueOrThrow);

      const messages = await db.query.message.findMany({
        where: { conversationId: finalConversationId },
        columns: {
          id: true,
          role: true,
          content: true,
          parentMessageId: true,
          createdAt: true,
        },
      });

      let conversationMessages: ChatCompletionMessageParam[] =
        buildConversationForAi(messages, newUserMessage.id);

      // Step 1: non-streaming call to check for tool calls
      const initialResponse = await openAi.chat.completions.create({
        model: OPEN_AI_MODEL,
        messages: conversationMessages,
        tools: toolSchemas,
        tool_choice: 'auto',
        stream: false,
      });

      const initialMessage = initialResponse.choices[0]?.message;
      if (!initialMessage) throw new HTTPException(500);

      conversationMessages = [...conversationMessages, initialMessage];

      // Step 2: execute tool calls if any
      for (const toolCall of initialMessage.tool_calls ?? []) {
        if (toolCall.type !== 'function') continue;

        const tool = toolMap[toolCall.function.name];
        if (!tool) continue;

        const args = JSON.parse(toolCall.function.arguments) as Record<
          string,
          unknown
        >;
        // eslint-disable-next-line no-console
        console.log(
          `[tool] executing ${toolCall.function.name} with args:`,
          args,
        );
        const result = await tool.execute(args);
        // eslint-disable-next-line no-console
        console.log(`[tool] ${toolCall.function.name} result:`, result);

        conversationMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      // Step 3: stream final response
      const chatStream = await openAi.chat.completions.create({
        model: OPEN_AI_MODEL,
        messages: conversationMessages,
        stream: true,
      });

      return streamChatResponse({
        context: c,
        chatStream,
        conversationId: finalConversationId,
        currentMessageId: newUserMessage.id,
      });
    },
  )
  .put(
    '/:conversationId',
    authMiddleware(),
    zodValidator(
      'param',
      z.object({ conversationId: z.coerce.number().int() }),
    ),
    zodValidator('json', z.object({ title: z.string().min(1).optional() })),
    async (c) => {
      const { userId } = c.var.userJwtPayload;
      const { conversationId } = c.req.valid('param');
      const { title } = c.req.valid('json');

      const conversationToUpdate = await db.query.conversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversationToUpdate) {
        throw new HTTPException(404, { message: 'Conversation not found' });
      }

      if (title) {
        await db
          .update(conversation)
          .set({ title })
          .where(eq(conversation.id, conversationId));
        return c.json({});
      }

      if (conversationToUpdate.title !== DEFAULT_CONVERSATION_TITLE) {
        return c.json({});
      }

      const messages = await db.query.message.findMany({
        where: { conversationId },
        columns: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
          parentMessageId: true,
        },
      });

      const chat = await createOpenAi().chat.completions.create({
        model: OPEN_AI_MODEL,
        messages: [
          ...buildConversationForAi(messages, null),
          { role: 'system', content: CREATE_TITLE_PROMPT },
        ],
      });

      const newTitle =
        takeFirstOrThrow(chat.choices).message.content ??
        DEFAULT_CONVERSATION_TITLE;

      await db
        .update(conversation)
        .set({ title: newTitle })
        .where(eq(conversation.id, conversationId));

      return c.json({ title: newTitle });
    },
  );

interface StreamChatResponseArgs<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  E extends Env = { Variables: any },
  P extends string = string,
  I extends Input = Input,
> {
  context: HonoContext<E, P, I>;
  chatStream: AsyncIterable<ChatCompletionChunk>;
  conversationId: number;
  currentMessageId: number;
}

function streamChatResponse({
  context,
  chatStream,
  conversationId,
  currentMessageId,
}: StreamChatResponseArgs) {
  return streamSSE(context, async (stream) => {
    await db.transaction(async (tx) => {
      const assistantMessage = await tx
        .insert(message)
        .values({
          conversationId,
          role: 'assistant',
          content: '',
          parentMessageId: currentMessageId,
        })
        .returning({ id: message.id })
        .then(takeUniqueOrThrow);

      await stream.writeSSE({
        event: 'meta',
        data: JSON.stringify({
          userMessageId: currentMessageId,
          assistantMessageId: assistantMessage.id,
          conversationId,
        }),
      });

      const chunks: string[] = [];
      for await (const chunk of chatStream) {
        const delta = chunk.choices[0]?.delta.content;
        if (delta) {
          chunks.push(delta);
          await stream.writeSSE({ data: delta });
        }
      }

      await tx
        .update(message)
        .set({ content: chunks.join('') })
        .where(eq(message.id, assistantMessage.id));
    });
  });
}
