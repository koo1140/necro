import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import React, { useState, useEffect, useCallback } from 'react';
import { getSettings, saveSettings } from '../services/storage.js';
import type { Settings } from '../types/index.js';

interface SettingsPageProps {
  onBack: () => void;
}

const FIELDS: { key: keyof Settings; label: string }[] = [
  { key: 'openrouterKey', label: 'OpenRouter API Key' },
  { key: 'groqKey', label: 'Groq API Key' },
  { key: 'mistralKey', label: 'Mistral API Key' },
  { key: 'opencodeKey', label: 'opencode API Key' },
];

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const currentField = FIELDS[selectedIdx];

  const maskedValue = (val: string) => {
    if (!val) return '';
    return val.length <= 8 ? val + '****' : val.slice(0, 8) + '****';
  };

  const save = useCallback(async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    await saveSettings(settings);
    setSaving(false);
    setMessage('Settings saved');
  }, [settings]);

  useInput((input, key) => {
    if (key.escape) {
      if (editing) {
        setEditing(false);
      } else {
        onBack();
      }
      return;
    }

    if (editing) {
      if (key.return) {
        setSettings((prev) => prev ? { ...prev, [currentField.key]: editValue } : prev);
        setEditing(false);
      } else if (key.tab) {
        setSettings((prev) => prev ? { ...prev, [currentField.key]: editValue } : prev);
        setEditing(false);
        setSelectedIdx((prev) => prev < FIELDS.length - 1 ? prev + 1 : 0);
      } else if (key.tab && key.shift) {
        setSettings((prev) => prev ? { ...prev, [currentField.key]: editValue } : prev);
        setEditing(false);
        setSelectedIdx((prev) => prev > 0 ? prev - 1 : FIELDS.length - 1);
      }
      return;
    }

    if (input === 's' && !key.ctrl && !key.meta) {
      save();
      return;
    }

    if (key.upArrow) {
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : FIELDS.length - 1));
      return;
    }

    if (key.downArrow) {
      setSelectedIdx((prev) => (prev < FIELDS.length - 1 ? prev + 1 : 0));
      return;
    }

    if (key.tab) {
      setSelectedIdx((prev) => (prev < FIELDS.length - 1 ? prev + 1 : 0));
      return;
    }

    if (key.tab && key.shift) {
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : FIELDS.length - 1));
      return;
    }

    if (key.return) {
      if (settings) {
        setEditValue(settings[currentField.key] as string || '');
        setEditing(true);
      }
    }
  });

  if (!settings) {
    return (
      <Box>
        <Text>Loading settings...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>Settings</Text>
      </Box>
      {FIELDS.map((field, idx) => {
        const val = settings[field.key] as string;
        const isSelected = idx === selectedIdx;
        return (
          <Box key={field.key} marginY={1}>
            <Box width={24}>
              <Text color={isSelected ? 'cyan' : undefined}>{field.label}</Text>
            </Box>
            <Box>
              {isSelected && editing ? (
                <TextInput
                  value={editValue}
                  onChange={setEditValue}
                  placeholder="Enter API key..."
                />
              ) : (
                <Box>
                  {val ? (
                    <Text color="green">{maskedValue(val)}</Text>
                  ) : (
                    <Text dimColor>Not configured</Text>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
      <Box marginTop={1} marginBottom={1}>
        <Text color="yellow">At least one provider must be configured</Text>
      </Box>
      <Box marginBottom={1}>
        <Box>
          {FIELDS.map((field) => {
            const configured = !!(settings[field.key] as string);
            return (
              <Text key={field.key}>
                {' '}
                <Text color={configured ? 'green' : 'red'}>
                  {configured ? '✓' : '✗'}
                </Text>
                {' '}
                <Text dimColor>{field.label.replace(' API Key', '')}</Text>
              </Text>
            );
          })}
        </Box>
      </Box>
      {message && (
        <Box marginBottom={1}>
          <Text color="green">{message}</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>[s] Save  [Esc] Back  [Tab/↑↓] Navigate  [Enter] Edit</Text>
      </Box>
    </Box>
  );
}
