import { Box, Text, useInput } from 'ink';
import React from 'react';
import { InputBar } from './input-bar.js';

interface StartScreenProps {
  onStartChat: (text: string) => void;
  onOpenSettings: () => void;
  onOpenSessions: () => void;
}

const LOGO = [
  `              .-"""""-.`,
  `            /         \\`,
  `           |  O     O  |`,
  `           |    ___    |`,
  `          /|   /   \\   |\\`,
  `         / |  |     |  | \\`,
  `        /  |  \\___/   |  \\`,
  `       /   |          |   \\`,
  `      /    |   ----   |    \\`,
  `     /     |  |    |  |     \\`,
  `    /      |  |____|  |      \\`,
  `   /       |          |       \\`,
  `  /        |   ----   |        \\`,
  ` /         |  |    |  |         \\`,
  `/__________|__|____|__|__________\\`,
  `           |          |`,
  `           |__________|`,
  `          /            \\`,
  `         /   NECRO     \\`,
  `        /   UNDEAD     \\`,
  `       /    KINGDOM     \\`,
  `      /__________________\\`,
];

export function StartScreen({ onStartChat, onOpenSettings, onOpenSessions }: StartScreenProps) {
  useInput((input, key) => {
    if (input === 't' && !key.ctrl && !key.meta) {
      onOpenSessions();
    }
    if (input === 's' && !key.ctrl && !key.meta) {
      onOpenSettings();
    }
  });

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" minHeight={20}>
      <Box flexDirection="column" alignItems="center">
        {LOGO.map((line, i) => (
          <Text key={i} color="green">{line}</Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text dimColor>Multi-Provider AI Agent  |  Type a message or /help to begin</Text>
      </Box>
      <Box marginTop={1} marginBottom={1}>
        <Text>
           [<Text color="cyan" underline>s</Text>] Settings  
           [<Text color="cyan" underline>t</Text>] Sessions
        </Text>
      </Box>
      <Box width="100%">
        <InputBar onSubmit={onStartChat} onStop={() => process.exit(0)} disabled={false} />
      </Box>
    </Box>
  );
}
