import { Box, Text } from 'ink';
import React from 'react';
import type { Message } from '../types/index.js';

interface MessageProps {
  message: Message;
}

export function Message({ message }: MessageProps) {
  if (message.role === 'system') {
    return (
      <Box>
        <Text dimColor>{message.content}</Text>
      </Box>
    );
  }

  if (message.role === 'tool') {
    return (
      <Box>
        <Text color="yellow">{message.content}</Text>
      </Box>
    );
  }

  const label = message.role === 'user' ? 'You' : 'Assistant';
  const color = message.role === 'user' ? 'green' : 'cyan';

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={color}>{label}: {message.content}</Text>
      </Box>
      {message.images && message.images.length > 0 && (
        <Box>
          {message.images.map((_, i) => (
            <Text key={i} color="yellow"> [image]</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
