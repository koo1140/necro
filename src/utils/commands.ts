import type { Command } from '../types/index.js';

export const commands: Command[] = [
  {
    name: '/help',
    description: 'Show available commands and usage',
    args: [
      { name: 'command', description: 'Get help for a specific command' },
    ],
  },
  {
    name: '/model',
    description: 'Set the AI model to use',
    args: [
      { name: 'model', description: 'Model identifier (e.g. openrouter/gpt-4o)' },
    ],
  },
  {
    name: '/mode',
    description: 'Switch between chat, agent, and necro modes',
    args: [
      { name: 'mode', description: 'chat, agent, or necro' },
    ],
  },
  {
    name: '/thinking',
    description: 'Toggle thinking mode on/off',
    args: [
      { name: 'on|off', description: 'Enable or disable thinking mode' },
    ],
  },
  {
    name: '/title',
    description: 'Set the session title',
    args: [
      { name: 'title', description: 'New title for the session' },
    ],
  },
  {
    name: '/settings',
    description: 'Open settings in your default editor',
    args: [],
  },
  {
    name: '/sessions',
    description: 'List all saved sessions',
    args: [],
  },
  {
    name: '/clear',
    description: 'Clear the current conversation',
    args: [],
  },
  {
    name: '/exit',
    description: 'Exit the application',
    args: [],
  },
];

export function getMatchingCommands(input: string): Command[] {
  const lower = input.toLowerCase();
  return commands.filter((cmd) => cmd.name.toLowerCase().includes(lower));
}

export function getMatchingArgs(command: string, input: string): { name: string; description: string }[] {
  const cmd = commands.find((c) => c.name === command);
  if (!cmd || !cmd.args) return [];
  const lower = input.toLowerCase();
  return cmd.args.filter((arg) => arg.name.toLowerCase().includes(lower));
}
