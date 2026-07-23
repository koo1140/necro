import { Box, Text, useInput } from 'ink';
import React, { useState, useMemo } from 'react';
import type { Message } from '../types/index.js';

interface NecroViewProps {
  messages: Message[];
  thinking: boolean;
}

const MAX_VISIBLE = 10;

export function NecroView({ messages, thinking }: NecroViewProps) {
  const { leftMessages, rightMessages, toolMessages } = useMemo(() => {
    const nonTool = messages.filter((m) => m.role !== 'tool');
    const tools = messages.filter((m) => m.role === 'tool');
    const left: Message[] = [];
    const right: Message[] = [];
    nonTool.forEach((m, i) => {
      if (i % 2 === 0) left.push(m);
      else right.push(m);
    });
    return { leftMessages: left, rightMessages: right, toolMessages: tools };
  }, [messages]);

  const [scrollA, setScrollA] = useState(0);
  const [scrollB, setScrollB] = useState(0);

  const hasBoth = leftMessages.length > 0 && rightMessages.length > 0;

  useInput((input, key) => {
    if (key.upArrow) {
      setScrollA((prev) => Math.max(0, prev - 1));
      setScrollB((prev) => Math.max(0, prev - 1));
      return;
    }
    if (key.downArrow) {
      setScrollA((prev) => {
        const max = Math.max(0, leftMessages.length - MAX_VISIBLE);
        return Math.min(max, prev + 1);
      });
      setScrollB((prev) => {
        const max = Math.max(0, rightMessages.length - MAX_VISIBLE);
        return Math.min(max, prev + 1);
      });
    }
  });

  const visibleA = leftMessages.slice(scrollA, scrollA + MAX_VISIBLE);
  const visibleB = rightMessages.slice(scrollB, scrollB + MAX_VISIBLE);

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="row" width="100%">
        <Box flexDirection="column" flexGrow={1} paddingRight={1}>
          <Box borderStyle="single" borderColor="cyan" paddingX={1}>
            <Text bold color="cyan">Necro A</Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            {visibleA.length === 0 ? (
              <Text dimColor>Waiting for Necro A...</Text>
            ) : (
              visibleA.map((msg, i) => (
                <Box key={scrollA + i} marginY={0}>
                  <Text wrap="wrap">{msg.content}</Text>
                </Box>
              ))
            )}
          </Box>
        </Box>
        <Box flexDirection="column" flexGrow={1} paddingLeft={1}>
          <Box borderStyle="single" borderColor="magenta" paddingX={1}>
            <Text bold color="magenta">Necro B</Text>
          </Box>
          <Box flexDirection="column" marginTop={1}>
            {visibleB.length === 0 ? (
              <Text dimColor>Waiting for Necro B...</Text>
            ) : (
              visibleB.map((msg, i) => (
                <Box key={scrollB + i} marginY={0}>
                  <Text wrap="wrap">{msg.content}</Text>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>
      <Box justifyContent="center" marginTop={1} marginBottom={1}>
        {thinking && hasBoth ? (
          <Text>💀 Necro Talk 💀</Text>
        ) : !thinking && hasBoth ? (
          <Text color="green">✓ Agreement reached</Text>
        ) : null}
      </Box>
      {toolMessages.length > 0 && (
        <Box borderStyle="round" borderColor="yellow" marginTop={1} paddingX={1} paddingY={0}>
          {toolMessages.map((msg, i) => (
            <Text key={i}>{msg.content}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
