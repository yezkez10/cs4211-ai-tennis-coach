import { Box, Card, Code, Stack, Table, Text, rem } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { CodeBlock } from 'components/CodeBlock';

import { type NonNullableUseGetConversationData } from 'hooks/useGetConversation';

interface Props {
  message: NonNullableUseGetConversationData[number];
}

export function MessageBubble({ message }: Props) {
  const { content: messageText, role } = message;
  const isUser = role === 'user';

  if (isUser) {
    return (
      <Stack>
        {messageText && (
          <Card
            maw="75%"
            bg="blue"
            c="white"
            ml="auto"
            style={{
              alignSelf: 'flex-end',
            }}
          >
            <Text fz="lg" style={{ whiteSpace: 'pre-wrap' }}>
              {messageText}
            </Text>
          </Card>
        )}
      </Stack>
    );
  }

  return (
    <Box w="100%" fz="lg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p({ children }) {
            return <Box>{children}</Box>;
          },
          code({
            className,
            children,
          }: {
            className?: string;
            children?: React.ReactNode;
          }) {
            const match = /language-(\w+)/.exec(className ?? '');
            const codeString = Array.isArray(children)
              ? children.join('')
              : typeof children === 'string'
                ? children
                : '';

            if (!match) return <Code>{codeString}</Code>;
            return (
              <CodeBlock code={codeString} language={match[1] ?? 'text'} />
            );
          },
          table({ children, ...props }) {
            return (
              <Table.ScrollContainer minWidth={500} type="native" pb={rem(10)}>
                <Table withTableBorder withColumnBorders {...props}>
                  {children}
                </Table>
              </Table.ScrollContainer>
            );
          },
          thead({ children, ...props }) {
            return <Table.Thead {...props}>{children}</Table.Thead>;
          },
          tr({ children, ...props }) {
            return <Table.Tr {...props}>{children}</Table.Tr>;
          },
          th({ children, ...props }) {
            return <Table.Th {...props}>{children}</Table.Th>;
          },
          td({ children, ...props }) {
            return <Table.Td {...props}>{children}</Table.Td>;
          },
        }}
      >
        {messageText}
      </ReactMarkdown>
    </Box>
  );
}
