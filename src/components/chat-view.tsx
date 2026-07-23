import { Box, Text, useInput, useApp } from 'ink';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Message, Session, Settings, Provider } from '../types/index.js';
import { getSettings, saveSettings, saveSession, getSession } from '../services/storage.js';
import { createClient } from '../services/providers.js';
import { commands } from '../utils/commands.js';
import { Message as MessageComponent } from './message.js';
import { NecroView } from './necro-view.js';
import { InputBar } from './input-bar.js';

const MAX_VISIBLE_MESSAGES = 30;
const PAGE_SIZE = 10;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getProviderFromModel(model: string): Provider {
  if (model.startsWith('openrouter/')) return 'openrouter';
  if (model.startsWith('groq/')) return 'groq';
  if (model.startsWith('mistral/')) return 'mistral';
  if (model.startsWith('opencode/')) return 'opencode';
  return 'openrouter';
}

function checkAgreement(a: string, b: string): boolean {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((w) => w.length > 4));
  if (wordsA.size === 0 || wordsB.size === 0) return false;
  let common = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) common++;
  }
  return common / Math.min(wordsA.size, wordsB.size) > 0.25;
}

function generateTitle(text: string): string {
  return text.split(/\s+/).slice(0, 7).join(' ');
}

interface ChatViewProps {
  sessionId?: string;
  onBack: () => void;
  onOpenSettings: () => void;
  onOpenSessions: () => void;
}

export function ChatView({ sessionId, onBack, onOpenSettings, onOpenSessions }: ChatViewProps) {
  const { exit } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionState, setSessionState] = useState<Session | null>(null);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [mode, setMode] = useState<'chat' | 'agent' | 'necro'>('chat');
  const [thinking, setThinking] = useState(false);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const sessionRef = useRef(sessionState);
  sessionRef.current = sessionState;

  useEffect(() => {
    getSettings().then(async (s) => {
      setSettingsState(s);
      setMode(s.mode);
      setThinking(s.thinking);

      if (sessionId) {
        const existing = await getSession(sessionId);
        if (existing) {
          setSessionState(existing);
          setMessages(existing.messages);
          setMode(existing.mode);
        } else {
          const newSession: Session = {
            id: generateId(),
            title: 'New Conversation',
            messages: [],
            mode: s.mode,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            model: s.model,
          };
          setSessionState(newSession);
        }
      } else {
        const newSession: Session = {
          id: generateId(),
          title: 'New Conversation',
          messages: [],
          mode: s.mode,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          model: s.model,
        };
        setSessionState(newSession);
      }

      setInitialized(true);
    });
  }, [sessionId]);

  useInput((_input, key) => {
    if (key.pageUp) {
      setScrollOffset((prev) => {
        const maxScroll = Math.max(0, messagesRef.current.length - MAX_VISIBLE_MESSAGES);
        return Math.min(maxScroll, prev + PAGE_SIZE);
      });
    }
    if (key.pageDown) {
      setScrollOffset((prev) => Math.max(0, prev - PAGE_SIZE));
    }
  });

  useEffect(() => {
    if (messages.length > MAX_VISIBLE_MESSAGES && scrollOffset > 0) {
      const maxScroll = messages.length - MAX_VISIBLE_MESSAGES;
      if (scrollOffset > maxScroll) {
        setScrollOffset(maxScroll);
      }
    }
  }, [messages.length, scrollOffset]);

  useEffect(() => {
    if (isLoading) {
      setScrollOffset(0);
    }
  }, [isLoading]);

  async function persistSession(msgs: Message[]): Promise<void> {
    const s = sessionRef.current;
    if (!s) return;
    const updated: Session = {
      ...s,
      messages: msgs,
      updatedAt: new Date().toISOString(),
      mode: modeRef.current,
    };
    setSessionState(updated);
    await saveSession(updated);
  }

  async function ensureSession(): Promise<Session> {
    const existing = sessionRef.current;
    if (existing) return existing;
    const s = settingsRef.current;
    const newSession: Session = {
      id: generateId(),
      title: 'New Conversation',
      messages: [],
      mode: modeRef.current,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model: s?.model || 'openrouter/auto',
    };
    setSessionState(newSession);
    return newSession;
  }

  async function simulateTool(name: string, args: string): Promise<string> {
    if (name === 'web_search') {
      return `Web search results for "${args}":\n1. Relevant information found about ${args}.\n2. Supporting data discovered.\n3. Additional context available.`;
    }
    return `Tool "${name}" executed with args "${args}". Result: Operation completed successfully.`;
  }

  function handleCommand(text: string): void {
    const parts = text.slice(1).split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const addSystemMessage = (content: string) => {
      setMessages((prev) => [...prev, { role: 'system', content }]);
    };

    switch (cmd) {
      case 'help': {
        const helpText = commands.map((c) => `${c.name} - ${c.description}`).join('\n');
        addSystemMessage(helpText);
        break;
      }
      case 'model': {
        if (args.length === 0) {
          addSystemMessage(`Current model: ${settingsRef.current?.model || 'unknown'}`);
          return;
        }
        const newModel = args.join(' ');
        setSettingsState((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, model: newModel };
          saveSettings(updated);
          return updated;
        });
        addSystemMessage(`Model changed to: ${newModel}`);
        break;
      }
      case 'mode': {
        if (args.length === 0 || !['chat', 'agent', 'necro'].includes(args[0])) {
          addSystemMessage('Usage: /mode <chat|agent|necro>');
          return;
        }
        const newMode = args[0] as 'chat' | 'agent' | 'necro';
        setMode(newMode);
        addSystemMessage(`Mode switched to: ${newMode}`);
        break;
      }
      case 'thinking': {
        if (args.length === 0) {
          addSystemMessage(`Thinking is currently ${thinking ? 'shown' : 'hidden'}`);
          return;
        }
        const show = args[0] === 'show' || args[0] === 'on';
        setThinking(show);
        addSystemMessage(`Thinking ${show ? 'shown' : 'hidden'}`);
        break;
      }
      case 'title': {
        if (args.length === 0) {
          addSystemMessage('Usage: /title <new title>');
          return;
        }
        const newTitle = args.join(' ');
        setSessionState((prev) => (prev ? { ...prev, title: newTitle } : prev));
        addSystemMessage(`Title set to: ${newTitle}`);
        break;
      }
      case 'settings':
        onOpenSettings();
        break;
      case 'sessions':
        onOpenSessions();
        break;
      case 'clear':
        setMessages([]);
        setScrollOffset(0);
        break;
      case 'exit':
        exit();
        break;
      default:
        addSystemMessage(`Unknown command: /${cmd}. Type /help for available commands.`);
    }
  }

  async function handleChatSubmit(msgs: Message[], agentMode: boolean): Promise<void> {
    const s = settingsRef.current;
    if (!s) return;

    const provider = getProviderFromModel(s.model);
    const client = createClient(provider, s);

    let systemPrompt: string | undefined;
    if (agentMode) {
      systemPrompt =
        'You are an autonomous agent. Use tools to complete tasks. Available: web_search (search the web). When you need a tool, respond with TOOL_CALL: <name> <args>. After tool results, continue answering.';
    }

    const messagesToSend: Message[] = systemPrompt
      ? [{ role: 'system', content: systemPrompt }, ...msgs]
      : msgs;

    let assistantContent = '';
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    const fullResponse = await client.chat(messagesToSend, s, (token) => {
      assistantContent += token;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], content: assistantContent };
        return updated;
      });
    });

    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullResponse };
      return updated;
    });

    if (agentMode) {
      const toolCallMatch = fullResponse.match(/TOOL_CALL:\s*(\w+)\s*(.*)/);
      if (toolCallMatch) {
        const [, toolName, toolArgs] = toolCallMatch;
        const toolResult = await simulateTool(toolName, toolArgs.trim());
        const toolMessage: Message = {
          role: 'tool',
          content: toolResult,
          name: toolName,
          tool_call_id: `tc-${Date.now()}`,
        };
        const postToolMessages: Message[] = [
          ...messagesToSend,
          { role: 'assistant', content: fullResponse.replace(/TOOL_CALL:.*/, '').trim() },
          toolMessage,
        ];
        setMessages((prev) => [...prev, toolMessage]);

        let followUpContent = '';
        setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

        const followUpResponse = await client.chat(postToolMessages, s, (token) => {
          followUpContent += token;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: followUpContent };
            return updated;
          });
        });

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: followUpResponse };
          return updated;
        });
      }
    }

    const sess = await ensureSession();
    if (sess.title === 'New Conversation') {
      const firstUser = msgs.find((m) => m.role === 'user');
      if (firstUser) {
        const title = generateTitle(firstUser.content);
        setSessionState((prev) => (prev ? { ...prev, title } : prev));
      }
    }

    await persistSession([...msgs, { role: 'assistant', content: fullResponse }]);
  }

  async function handleNecroSubmit(msgs: Message[], userText: string): Promise<void> {
    const s = settingsRef.current;
    if (!s) return;

    const modelA = s.topModelA || s.model;
    const modelB = s.topModelB || s.model;
    const settingsA = { ...s, model: modelA };
    const settingsB = { ...s, model: modelB };
    const clientA = createClient(getProviderFromModel(modelA), settingsA);
    const clientB = createClient(getProviderFromModel(modelB), settingsB);

    const debateMessages: Message[] = [];

    const updateDisplay = (debate: Message[]) => {
      setMessages([...msgs, ...debate]);
    };

    async function runDebate(): Promise<void> {
      let phase: 'initial' | 'talk-a' | 'talk-b' | 'tool' | 'post-tool' | 'finalize' = 'initial';
      let round = 0;
      const maxRounds = 6;
      let responseA = '';
      let responseB = '';

      while (phase !== 'finalize' && round < maxRounds) {
        round++;

        if (phase === 'initial') {
          const baseMessages: Message[] = [{ role: 'user', content: userText }, ...debateMessages];
          let contentA = '';
          let contentB = '';
          const aIdx = debateMessages.length;
          const bIdx = debateMessages.length + 1;

          debateMessages.push({ role: 'assistant', content: '' });
          debateMessages.push({ role: 'assistant', content: '' });
          updateDisplay(debateMessages);

          const [respA, respB] = await Promise.all([
            clientA.chat(baseMessages, settingsA, (token) => {
              contentA += token;
              debateMessages[aIdx] = { role: 'assistant', content: contentA };
              updateDisplay(debateMessages);
            }),
            clientB.chat(baseMessages, settingsB, (token) => {
              contentB += token;
              debateMessages[bIdx] = { role: 'assistant', content: contentB };
              updateDisplay(debateMessages);
            }),
          ]);

          responseA = respA;
          responseB = respB;
          debateMessages[aIdx] = { role: 'assistant', content: respA };
          debateMessages[bIdx] = { role: 'assistant', content: respB };
          updateDisplay(debateMessages);

          if (checkAgreement(respA, respB)) {
            phase = 'tool';
          } else {
            phase = 'talk-a';
          }
        } else if (phase === 'talk-a') {
          const prompt: Message[] = [
            { role: 'user', content: userText },
            ...debateMessages,
            {
              role: 'user',
              content: `Your necro partner (Necro B) responded:\n\n${responseB}\n\nDo you agree? If not, explain your counter-argument.`,
            },
          ];

          let contentA = '';
          const aIdx = debateMessages.length;
          debateMessages.push({ role: 'assistant', content: '' });
          updateDisplay(debateMessages);

          responseA = await clientA.chat(prompt, settingsA, (token) => {
            contentA += token;
            debateMessages[aIdx] = { role: 'assistant', content: contentA };
            updateDisplay(debateMessages);
          });

          debateMessages[aIdx] = { role: 'assistant', content: responseA };
          updateDisplay(debateMessages);
          phase = 'talk-b';
        } else if (phase === 'talk-b') {
          const prompt: Message[] = [
            { role: 'user', content: userText },
            ...debateMessages,
            {
              role: 'user',
              content: `Your necro partner (Necro A) responded:\n\n${responseA}\n\nDo you agree? If not, explain your counter-argument.`,
            },
          ];

          let contentB = '';
          const bIdx = debateMessages.length;
          debateMessages.push({ role: 'assistant', content: '' });
          updateDisplay(debateMessages);

          responseB = await clientB.chat(prompt, settingsB, (token) => {
            contentB += token;
            debateMessages[bIdx] = { role: 'assistant', content: contentB };
            updateDisplay(debateMessages);
          });

          debateMessages[bIdx] = { role: 'assistant', content: responseB };
          updateDisplay(debateMessages);

          if (checkAgreement(responseA, responseB)) {
            phase = 'tool';
          } else {
            phase = 'talk-a';
          }
        } else if (phase === 'tool') {
          const agreedResponse = responseA.length > responseB.length ? responseA : responseB;
          const toolResult = await simulateTool('necro_consensus', agreedResponse.substring(0, 100));
          const toolMessage: Message = {
            role: 'tool',
            content: toolResult,
            name: 'necro_consensus',
            tool_call_id: `necro-${Date.now()}`,
          };
          debateMessages.push(toolMessage);
          updateDisplay(debateMessages);
          phase = 'post-tool';
        } else if (phase === 'post-tool') {
          const finalPrompt: Message[] = [
            { role: 'user', content: userText },
            ...debateMessages,
            { role: 'user', content: 'Based on the tool result above, provide your final answer to the user.' },
          ];

          let contentA = '';
          let contentB = '';
          const aIdx = debateMessages.length;
          const bIdx = debateMessages.length + 1;

          debateMessages.push({ role: 'assistant', content: '' });
          debateMessages.push({ role: 'assistant', content: '' });
          updateDisplay(debateMessages);

          const [respA, respB] = await Promise.all([
            clientA.chat(finalPrompt, settingsA, (token) => {
              contentA += token;
              debateMessages[aIdx] = { role: 'assistant', content: contentA };
              updateDisplay(debateMessages);
            }),
            clientB.chat(finalPrompt, settingsB, (token) => {
              contentB += token;
              debateMessages[bIdx] = { role: 'assistant', content: contentB };
              updateDisplay(debateMessages);
            }),
          ]);

          responseA = respA;
          responseB = respB;
          debateMessages[aIdx] = { role: 'assistant', content: respA };
          debateMessages[bIdx] = { role: 'assistant', content: respB };
          updateDisplay(debateMessages);

          const conclusion = `**Necro Conclusion**\n\nNecro A:\n${respA}\n\nNecro B:\n${respB}`;
          debateMessages.push({ role: 'assistant', content: conclusion });
          updateDisplay(debateMessages);
          phase = 'finalize';
        }
      }

      if (phase !== 'finalize') {
        debateMessages.push({
          role: 'system',
          content: 'Necro debate reached maximum rounds without final agreement.',
        });
        updateDisplay(debateMessages);
      }
    }

    await runDebate();

    const sess = await ensureSession();
    if (sess.title === 'New Conversation') {
      const title = generateTitle(userText);
      setSessionState((prev) => (prev ? { ...prev, title } : prev));
    }

    await persistSession([...msgs, ...debateMessages]);
  }

  async function handleSubmit(text: string): Promise<void> {
    if (isLoadingRef.current || !initialized) return;

    if (text.startsWith('/')) {
      handleCommand(text);
      return;
    }

    const userMessage: Message = { role: 'user', content: text };
    const updatedMessages = [...messagesRef.current, userMessage];
    setMessages(updatedMessages);
    setScrollOffset(0);
    setIsLoading(true);

    try {
      if (modeRef.current === 'necro') {
        await handleNecroSubmit(updatedMessages, text);
      } else {
        await handleChatSubmit(updatedMessages, modeRef.current === 'agent');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [...prev, { role: 'system', content: `Error: ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleStop(): void {
    setIsLoading(false);
  }

  const visibleMessages = useMemo(() => {
    if (messages.length <= MAX_VISIBLE_MESSAGES) return messages;
    return messages.slice(scrollOffset, scrollOffset + MAX_VISIBLE_MESSAGES);
  }, [messages, scrollOffset]);

  const userMessages = useMemo(() => messages.filter((m) => m.role === 'user'), [messages]);
  const necroDisplayMessages = useMemo(() => messages.filter((m) => m.role !== 'user'), [messages]);

  if (!initialized) {
    return (
      <Box>
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" padding={0}>
      <Box marginBottom={1}>
        <Text bold>{sessionState?.title || 'Chat'}</Text>
        <Text> </Text>
        <Text dimColor>({mode})</Text>
        <Text> </Text>
        <Text color="cyan">{settings?.model || ''}</Text>
      </Box>

      <Box flexGrow={1} flexDirection="column" marginBottom={1}>
        {mode === 'necro' ? (
          <>
            {userMessages.map((msg, i) => (
              <Box key={i} marginBottom={1}>
                <MessageComponent message={msg} />
              </Box>
            ))}
            <NecroView messages={necroDisplayMessages} thinking={isLoading} />
          </>
        ) : (
          <>
            {visibleMessages.map((msg, i) => (
              <Box key={i} marginBottom={1}>
                <MessageComponent message={msg} />
              </Box>
            ))}
          </>
        )}

        {isLoading && (
          <Box>
            <Text color="yellow">
              {mode === 'necro'
                ? 'Necros are debating...'
                : mode === 'agent'
                  ? 'Agent is working...'
                  : 'Thinking...'}
            </Text>
          </Box>
        )}
      </Box>

      <InputBar onSubmit={handleSubmit} onStop={handleStop} disabled={isLoading} />
    </Box>
  );
}
