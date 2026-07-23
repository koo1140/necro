import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import React, { useState, useEffect } from 'react';
import { getSessions } from '../services/storage.js';
import type { Session } from '../types/index.js';

interface SessionsPageProps {
  onBack: () => void;
  onOpenSession: (sessionId: string) => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}

function truncateTitle(title: string, maxWords: number = 7): string {
  const words = title.split(' ');
  if (words.length <= maxWords) return title;
  return words.slice(0, maxWords).join(' ') + '...';
}

export function SessionsPage({ onBack, onOpenSession }: SessionsPageProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    getSessions().then(setSessions);
  }, []);

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  const safeIdx = filtered.length === 0 ? 0 : Math.min(selectedIdx, filtered.length - 1);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
      return;
    }

    if (key.return && filtered.length > 0) {
      onOpenSession(filtered[safeIdx].id);
      return;
    }

    if (key.backspace && search === '') {
      onBack();
      return;
    }

    if (key.upArrow) {
      if (filtered.length > 0) {
        setSelectedIdx((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
      }
      return;
    }

    if (key.downArrow) {
      if (filtered.length > 0) {
        setSelectedIdx((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
      }
      return;
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold underline>Sessions</Text>
      </Box>
      <Box marginBottom={1}>
        <Text>Search: </Text>
        <TextInput
          value={search}
          onChange={(v) => { setSearch(v); setSelectedIdx(0); }}
          placeholder="Type to filter..."
        />
      </Box>
      {filtered.length === 0 ? (
        <Box marginTop={1}>
          <Text dimColor>
            {sessions.length === 0 ? 'No sessions yet' : 'No sessions match your search'}
          </Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {filtered.map((session, idx) => {
            const isSelected = idx === safeIdx;
            return (
              <Box key={session.id} marginY={0}>
                <Box>
                  {isSelected && <Text color="cyan">› </Text>}
                  {!isSelected && <Text>  </Text>}
                  <Box flexDirection="column">
                    <Box>
                      <Text color={isSelected ? 'cyan' : undefined}>
                        {truncateTitle(session.title)}
                      </Text>
                    </Box>
                    <Box marginLeft={2}>
                      <Text dimColor>
                        {session.mode} | {session.model} | {formatDate(session.updatedAt)}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
      <Box marginTop={1}>
        <Text dimColor>[↑↓] Navigate  [Enter] Open  [Esc] Back  [Bksp] Back</Text>
      </Box>
    </Box>
  );
}
