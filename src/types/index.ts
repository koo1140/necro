export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface Message {
  role: MessageRole;
  content: string;
  images?: string[];
  tool_call_id?: string;
  name?: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  mode: 'chat' | 'agent' | 'necro';
  createdAt: string;
  updatedAt: string;
  model: string;
}

export interface Settings {
  openrouterKey: string;
  groqKey: string;
  mistralKey: string;
  opencodeKey: string;
  model: string;
  mode: 'chat' | 'agent' | 'necro';
  thinking: boolean;
  topModelA: string;
  topModelB: string;
}

export type Provider = 'openrouter' | 'groq' | 'mistral' | 'opencode';

export interface NecroOpinion {
  provider: Provider;
  message: string;
  agree: boolean;
}

export interface Command {
  name: string;
  description: string;
  args?: { name: string; description: string }[];
}

export interface InputPaste {
  type: 'text' | 'image';
  content: string;
  lines?: number;
  filename?: string;
}
