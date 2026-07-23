import { Box, Text } from 'ink';
import React from 'react';
import type { Command } from '../types/index.js';

interface AutocompleteProps {
  commands: Command[];
  selectedIndex: number;
  filter: string;
}

const MAX_VISIBLE = 8;

export function Autocomplete({ commands, selectedIndex, filter }: AutocompleteProps) {
  if (!filter || commands.length === 0) {
    return null;
  }

  const startOffset = Math.max(0, Math.min(selectedIndex - Math.floor(MAX_VISIBLE / 2), commands.length - MAX_VISIBLE));
  const visible = commands.slice(startOffset, startOffset + MAX_VISIBLE);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {visible.map((cmd, i) => {
        const idx = startOffset + i;
        const isSelected = idx === selectedIndex;
        return (
          <Box key={cmd.name} flexDirection="column">
            <Box>
              {isSelected ? (
                <Text backgroundColor="blue" color="white">
                  {cmd.name} - {cmd.description}
                </Text>
              ) : (
                <Text>
                  {cmd.name} - {cmd.description}
                </Text>
              )}
            </Box>
            {cmd.args && cmd.args.length > 0 && (
              <Box paddingLeft={2}>
                <Text dimColor>
                  {cmd.args.map((a) => a.name).join(', ')}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}
