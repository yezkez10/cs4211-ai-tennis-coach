import { useEffect, useRef } from 'react';

import { Box, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { client } from 'client';

import { MessageBubble } from 'components/chat/MessageBubble';
import { MessageInput } from 'components/chat/MessageInput';

import {
  type NonNullableUseGetConversationData,
  useGetConversation,
} from 'hooks/useGetConversation';
import { useStreamingMessages } from 'hooks/useStreamingMessages';

interface Props {
  conversationId: number | null;
  onConversationCreated: (conversationId: number) => void;
}

const CONVO_LENGTH_BEFORE_TITLE_GENERATED = 6;

export function ChatBody({ conversationId, onConversationCreated }: Props) {
  const abortControllerRef = useRef<AbortController>(new AbortController());
  const queryClient = useQueryClient();
  const { data: serverMessages, isLoading } =
    useGetConversation(conversationId);

  const {
    startStream,
    abortStream,
    messagesToRender,
    setPendingUserMessage,
    isStreaming,
    hasReceivedContent,
  } = useStreamingMessages({
    serverMessages: serverMessages ?? [],
    abortControllerRef,
    conversationId,
  });

  const { mutate: renameConversation } = useMutation({
    mutationFn: async ({ conversationId }: { conversationId: number }) => {
      await client.api.conversation[':conversationId'].$put({
        param: { conversationId: String(conversationId) },
        json: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const { mutate: sendMessage, isPending: isMessageSending } = useMutation({
    mutationFn: async (
      userMessage: NonNullableUseGetConversationData[number],
    ) => {
      const parentMessageId =
        messagesToRender.filter((m) => m.role !== 'user').at(-1)?.id ?? null;

      const response = await client.api.conversation.$post(
        {
          json: {
            content: userMessage.content,
            conversationId,
            parentMessageId,
          },
        },
        { init: { signal: abortControllerRef.current.signal } },
      );

      if (!response.ok || !(response.body instanceof ReadableStream)) {
        throw new Error();
      }

      return response.body as ReadableStream<Uint8Array>;
    },
    onSuccess: async (stream) => {
      const meta = await startStream(stream);
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      if (meta?.conversationId) {
        onConversationCreated(meta.conversationId);
        if (serverMessages?.length === CONVO_LENGTH_BEFORE_TITLE_GENERATED) {
          renameConversation({ conversationId: meta.conversationId });
        }
      }
    },
  });

  const hasMessages = messagesToRender.length > 0;
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isWaitingForResponse =
    isMessageSending || (isStreaming && !hasReceivedContent);

  useEffect(() => {
    setTimeout(
      () => bottomRef.current?.scrollIntoView(),
      isStreaming ? 1000 : 0,
    );
  }, [messagesToRender, isStreaming]);

  return (
    <Stack
      h="100%"
      align="center"
      justify={hasMessages ? 'space-between' : 'center'}
    >
      {isLoading ? (
        <Loader m="auto" />
      ) : (
        <>
          {hasMessages ? (
            <Stack w="65%" py="md" gap="xl">
              {messagesToRender.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isWaitingForResponse && (
                <Group gap="0">
                  <Loader size="xs" mr="xs" />
                  <Text c="dimmed" fz="sm">
                    Thinking...
                  </Text>
                </Group>
              )}
            </Stack>
          ) : (
            <Title ta="center">What are you working on?</Title>
          )}
          <Box ref={bottomRef} />
          <Stack
            pos="sticky"
            w="65%"
            bg="white"
            pb="xl"
            bottom={0}
            style={{
              borderTopRightRadius: 20,
              borderTopLeftRadius: 20,
              zIndex: 1,
            }}
          >
            <MessageInput
              key={conversationId}
              onSend={(userMessage) => {
                setPendingUserMessage(userMessage);
                sendMessage(userMessage);
              }}
              canAbort={isStreaming || isMessageSending}
              abortStream={abortStream}
            />
          </Stack>
        </>
      )}
    </Stack>
  );
}
