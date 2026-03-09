import { Suspense, lazy, useState } from 'react';

import { ActionIcon, Box, Loader, Tooltip, rem } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

const LazySyntaxHighlighter = lazy(
  () => import('components/LazySyntaxHighlighter'),
);

const COPY_TIMEOUT_MS = 1000;

interface Props {
  code: string;
  language: string;
}

export function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_TIMEOUT_MS);
    });
  };

  return (
    <Box pos="relative">
      <Tooltip label={copied ? 'Copied' : 'Copy'} position="left" withArrow>
        <ActionIcon
          onClick={handleCopy}
          variant="transparent"
          size="sm"
          pos="absolute"
          top={rem(8)}
          right={rem(8)}
          style={{ zIndex: 10 }}
        >
          {copied ? <IconCheck /> : <IconCopy />}
        </ActionIcon>
      </Tooltip>
      <Suspense fallback={<Loader />}>
        <LazySyntaxHighlighter language={language} code={code} />
      </Suspense>
    </Box>
  );
}
