import OpenAI from 'openai';
import type { Message, Provider, Settings } from '../types';

export interface ProviderClient {
  chat(
    messages: Message[],
    settings: Settings,
    onToken: (token: string) => void,
  ): Promise<string>;
}

export function createClient(provider: Provider, settings: Settings): ProviderClient {
  switch (provider) {
    case 'openrouter':
      return createOpenRouterClient(settings.openrouterKey);
    case 'groq':
      return createGroqClient(settings.groqKey);
    case 'mistral':
      return createMistralClient(settings.mistralKey);
    case 'opencode':
      return createOpenCodeClient();
  }
}

function mapMessages(messages: Message[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  return messages.map((msg) => {
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
    return { role: msg.role, content: msg.content } as OpenAI.Chat.Completions.ChatCompletionMessageParam;
  });
}

async function streamChat(
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  onToken: (token: string) => void,
): Promise<string> {
  const stream = await client.chat.completions.create({
    model,
    messages,
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
}

async function nonStreamingChat(
  client: OpenAI,
  model: string,
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  onToken: (token: string) => void,
): Promise<string> {
  const response = await client.chat.completions.create({
    model,
    messages,
    stream: false,
  });
  const content = response.choices[0]?.message?.content || '';
  if (content) onToken(content);
  return content;
}

function createOpenRouterClient(apiKey: string): ProviderClient {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'https://github.com/',
      'X-Title': 'Necromancer CLI',
    },
  });

  return {
    async chat(messages, settings, onToken) {
      const openaiMessages = mapMessages(messages);
      try {
        return await streamChat(client, settings.model, openaiMessages, onToken);
      } catch {
        return await nonStreamingChat(client, settings.model, openaiMessages, onToken);
      }
    },
  };
}

function createGroqClient(apiKey: string): ProviderClient {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  return {
    async chat(messages, settings, onToken) {
      const openaiMessages = mapMessages(messages);
      try {
        return await streamChat(client, settings.model, openaiMessages, onToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Groq API error: ${message}`);
      }
    },
  };
}

function createMistralClient(apiKey: string): ProviderClient {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.mistral.ai/v1',
  });

  return {
    async chat(messages, settings, onToken) {
      const openaiMessages = mapMessages(messages);
      try {
        return await streamChat(client, settings.model, openaiMessages, onToken);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Mistral API error: ${message}`);
      }
    },
  };
}

function createOpenCodeClient(): ProviderClient {
  return {
    async chat() {
      throw new Error('opencode provider is not implemented');
    },
  };
}
