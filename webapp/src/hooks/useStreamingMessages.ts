import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import dayjs from 'dayjs';
import { z } from 'zod';

import { type NonNullableUseGetConversationData } from 'hooks/useGetConversation';

import { streamToAsyncIterable } from 'utils/utils';

export const TEMP_ID = -1;

const metaSchema = z.object({
  userMessageId: z.number(),
  assistantMessageId: z.number(),
  conversationId: z.number(),
});
type MetaData = z.infer<typeof metaSchema>;

interface Args {
  abortControllerRef: React.MutableRefObject<AbortController>;
  serverMessages: NonNullableUseGetConversationData;
  conversationId: number | null;
}

export function useStreamingMessages({
  abortControllerRef,
  serverMessages,
  conversationId,
}: Args) {
  const abortStream = useCallback(() => {
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    bufferRef.current = [];
    tokenCountRef.current = 0;
    setIsStreaming(false);
    setHasReceivedContent(false);
  }, [abortControllerRef]);

  useEffect(() => {
    abortStream();
    setPendingUserMessage(null);
    setStreamingMessage(null);
  }, [abortStream, conversationId]);

  const metaRef = useRef<MetaData | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<
    NonNullableUseGetConversationData[number] | null
  >(null);

  const [streamingMessage, setStreamingMessage] = useState<
    NonNullableUseGetConversationData[number] | null
  >(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasReceivedContent, setHasReceivedContent] = useState(false);
  const bufferRef = useRef<string[]>([]);
  const tokenCountRef = useRef<number>(0);
  const TOKEN_BATCH_SIZE = 10;

  const messagesToRender = useMemo(() => {
    const full = [...serverMessages];

    if (pendingUserMessage) {
      const exists = full.some((m) => m.id === pendingUserMessage.id);
      if (!exists) {
        full.push({ ...pendingUserMessage, role: 'user' });
      }
    }

    if (streamingMessage) {
      const exists = full.some((m) => m.id === streamingMessage.id);
      if (!exists) {
        full.push({ ...streamingMessage, role: 'assistant' });
      }
    }

    return full;
  }, [serverMessages, pendingUserMessage, streamingMessage]);

  const flushBuffer = () => {
    const nextChunk = bufferRef.current.join('');
    bufferRef.current = [];
    tokenCountRef.current = 0;

    setStreamingMessage((prev) => {
      if (!prev) return null;
      return { ...prev, content: prev.content + nextChunk };
    });
  };

  const handleMessage = (token: string) => {
    setHasReceivedContent(true);
    bufferRef.current.push(token);
    tokenCountRef.current++;

    if (tokenCountRef.current >= TOKEN_BATCH_SIZE) {
      flushBuffer();
    }
  };

  const handleMeta = (data: string) => {
    const parsed: unknown = JSON.parse(data);
    const validationResult = metaSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error('Invalid stream meta data', data);
      return;
    }

    const { assistantMessageId, userMessageId, conversationId } =
      validationResult.data;

    metaRef.current = { assistantMessageId, userMessageId, conversationId };
    bufferRef.current = [];
    tokenCountRef.current = 0;

    setPendingUserMessage((prev) => {
      if (prev?.id === TEMP_ID) return { ...prev, id: userMessageId };
      return prev;
    });

    setStreamingMessage({
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: dayjs().toDate().toISOString(),
      parentMessageId: userMessageId,
    });
  };

  const startStream = async (stream: ReadableStream<Uint8Array>) => {
    if (isStreaming) {
      console.error('Stream already started');
      return;
    }
    setIsStreaming(true);
    setHasReceivedContent(false);

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      for await (const chunk of streamToAsyncIterable(reader)) {
        buffer += decoder.decode(chunk, { stream: true });

        let blockEnd = buffer.indexOf('\n\n');
        while (blockEnd !== -1) {
          const rawBlock = buffer.slice(0, blockEnd);
          buffer = buffer.slice(blockEnd + 2);
          blockEnd = buffer.indexOf('\n\n');

          const lines = rawBlock.split('\n');
          let event = 'message';
          const dataLines: string[] = [];

          for (const line of lines) {
            if (line.startsWith('event:')) {
              event = line.slice(7).trim();
            } else if (line.startsWith('data:')) {
              dataLines.push(line.slice(6));
            }
          }

          const rawData = dataLines.join('\n');

          if (event === 'message') {
            handleMessage(rawData);
          }

          if (event === 'meta') {
            handleMeta(rawData);
          }
        }
      }

      flushBuffer();
      return metaRef.current;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Abort error is expected when the stream is aborted
      } else {
        console.error('Streaming error:', err);
      }
    } finally {
      setIsStreaming(false);
      setHasReceivedContent(false);
    }
  };

  return {
    startStream,
    abortStream,
    messagesToRender,
    setPendingUserMessage,
    isStreaming,
    hasReceivedContent,
  };
}
