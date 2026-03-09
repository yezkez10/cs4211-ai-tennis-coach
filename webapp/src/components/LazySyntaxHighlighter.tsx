import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface Props {
  language: string;
  code: string;
}

export default function LazySyntaxHighlighter({ language, code }: Props) {
  return (
    <SyntaxHighlighter
      language={language}
      style={vscDarkPlus}
      showLineNumbers
      PreTag="div"
      customStyle={{ borderRadius: '0.5rem' }}
    >
      {code}
    </SyntaxHighlighter>
  );
}
