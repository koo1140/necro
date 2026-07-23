import OpenAI from 'openai';
import type { Message, Settings } from '../types';
import type { ProviderClient } from './providers';

export function createOpenRouterClient(apiKey: string): ProviderClient {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/',
      'X-Title': 'Necromancer CLI',
    },
  });

  return {
    async chat(
      messages: Message[],
      settings: Settings,
      onToken: (token: string) => void,
    ): Promise<string> {
      const openaiMessages = messages.map((msg) => {
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: 'text', text: msg.content },
              ...msg.images.map((url) => ({
                type: 'image_url' as const,
                image_url: { url },
              })),
            ],
          } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
        }
        return {
          role: msg.role,
          content: msg.content,
        } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
      });

      try {
        const stream = await client.chat.completions.create({
          model: settings.model,
          messages: openaiMessages,
          stream: true,
        });

        let fullContent = '';
        for await (const chunk of stream) {
          const token = chunk.choices[0]?.delta?.content || '';
          if (token) {
            fullContent += token;
            onToken(token);
          }
        }
        return fullContent;
      } catch {
        const response = await client.chat.completions.create({
          model: settings.model,
          messages: openaiMessages,
          stream: false,
        });

        const content = response.choices[0]?.message?.content || '';
        if (content) onToken(content);
        return content;
      }
    },
  };
}
