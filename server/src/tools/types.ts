import { type ChatCompletionTool } from 'openai/resources';

export interface Tool {
  schema: ChatCompletionTool & { type: 'function' };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}
