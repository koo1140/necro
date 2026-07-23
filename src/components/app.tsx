import { Box, Text, useInput, useApp } from 'ink';
import React, { useState } from 'react';
import { StartScreen } from './start-screen.js';
import { SettingsPage as Settings } from './settings.js';
import { SessionsPage as Sessions } from './sessions.js';
import { ChatView } from './chat-view.js';

type Page = 'main' | 'settings' | 'sessions' | 'chat';

export function App() {
  const [currentPage, setCurrentPage] = useState<Page>('main');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined);
  const [pageHistory, setPageHistory] = useState<Page[]>([]);

  function navigate(page: Page) {
    setPageHistory((prev) => [...prev, currentPage]);
    setCurrentPage(page);
  }

  function goBack() {
    if (pageHistory.length === 0) {
      setCurrentPage('main');
      return;
    }
    const previous = pageHistory[pageHistory.length - 1];
    setPageHistory((prev) => prev.slice(0, -1));
    setCurrentPage(previous);
  }

  function handleStartChat(text: string) {
    setCurrentSessionId(undefined);
    navigate('chat');
  }

  function handleOpenSettings() {
    navigate('settings');
  }

  function handleOpenSessions() {
    navigate('sessions');
  }

  function handleOpenSession(id: string) {
    setCurrentSessionId(id);
    setCurrentPage('chat');
  }

  function handleBackToMain() {
    setCurrentPage('main');
    setPageHistory([]);
  }

  switch (currentPage) {
    case 'main':
      return (
        <StartScreen
          onStartChat={handleStartChat}
          onOpenSettings={handleOpenSettings}
          onOpenSessions={handleOpenSessions}
        />
      );
    case 'settings':
      return <Settings onBack={goBack} />;
    case 'sessions':
      return <Sessions onBack={goBack} onOpenSession={handleOpenSession} />;
    case 'chat':
      return (
        <ChatView
          sessionId={currentSessionId}
          onBack={handleBackToMain}
          onOpenSettings={handleOpenSettings}
          onOpenSessions={handleOpenSessions}
        />
      );
  }
}
