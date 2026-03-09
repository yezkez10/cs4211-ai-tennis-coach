import { ENV_VARS } from 'env';

import OpenAI from 'openai';

const { OPENAI_API_KEY } = ENV_VARS;

export function createOpenAi(abortSignal?: AbortSignal) {
  return new OpenAI({
    apiKey: OPENAI_API_KEY,
    ...(abortSignal && {
      fetch: (url: RequestInfo | URL, options?: RequestInit) =>
        fetch(url, { ...options, signal: abortSignal }),
    }),
  });
}

export const CREATE_TITLE_PROMPT = `Generate a short, descriptive title for the conversation above. 
The title should be specific, creative, and no more than 3 words. 
Avoid generic phrases like "Chat with assistant" or "Conversation". 
Capture the main theme or topic discussed.
The title should not mention what the user said, but what you think the conversation is about.`;
