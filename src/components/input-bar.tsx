import { Box, Text, useInput } from 'ink';
import React, { useState, useRef, useEffect } from 'react';
import { Autocomplete } from './autocomplete.js';
import { getMatchingCommands } from '../utils/commands.js';
import { detectPaste, detectImagePaste } from '../utils/paste-detector.js';

interface InputBarProps {
  onSubmit: (text: string) => void;
  onStop: () => void;
  disabled: boolean;
}

export function InputBar({ onSubmit, onStop, disabled }: InputBarProps) {
  const [text, setText] = useState('');
  const [cursor, setCursor] = useState(0);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [autocompleteIdx, setAutocompleteIdx] = useState(-1);
  const cursorRef = useRef(cursor);
  cursorRef.current = cursor;
  const textRef = useRef(text);
  textRef.current = text;

  const pasteInfo = detectPaste(text);
  const imageInfo = detectImagePaste(text);
  const hasPaste = pasteInfo !== null;
  const hasImage = imageInfo !== null;

  const matches = text.startsWith('/') ? getMatchingCommands(text) : [];
  const showAutocomplete = matches.length > 0;

  useEffect(() => {
    setAutocompleteIdx(showAutocomplete ? 0 : -1);
  }, [showAutocomplete]);

  useInput((input, key) => {
    if (disabled) return;

    const curText = textRef.current;
    const curCursor = cursorRef.current;

    if (key.return) {
      if (curText.trim()) {
        onSubmit(curText);
        setText('');
        setCursor(0);
        setShowConfirmExit(false);
        setAutocompleteIdx(-1);
      }
      return;
    }

    if (key.escape) {
      if (showConfirmExit) {
        onStop();
      } else if (hasPaste || hasImage) {
        setText('');
        setCursor(0);
      } else {
        setShowConfirmExit(true);
      }
      return;
    }

    if (showConfirmExit) {
      setShowConfirmExit(false);
    }

    if (key.upArrow) {
      if (showAutocomplete && autocompleteIdx > 0) {
        setAutocompleteIdx((prev) => prev - 1);
      }
      return;
    }

    if (key.downArrow) {
      if (showAutocomplete && autocompleteIdx < matches.length - 1) {
        setAutocompleteIdx((prev) => prev + 1);
      }
      return;
    }

    if (key.backspace) {
      if (curCursor > 0) {
        const newText = curText.slice(0, curCursor - 1) + curText.slice(curCursor);
        setText(newText);
        setCursor(curCursor - 1);
      }
      return;
    }

    if (key.delete) {
      if (curCursor < curText.length) {
        setText(curText.slice(0, curCursor) + curText.slice(curCursor + 1));
      }
      return;
    }

    if (key.leftArrow) {
      if (curCursor > 0) setCursor(curCursor - 1);
      return;
    }

    if (key.rightArrow) {
      if (curCursor < curText.length) setCursor(curCursor + 1);
      return;
    }

    if (key.tab && showAutocomplete && autocompleteIdx >= 0 && autocompleteIdx < matches.length) {
      const selected = matches[autocompleteIdx];
      setText(selected.name + ' ');
      setCursor(selected.name.length + 1);
      setAutocompleteIdx(-1);
      return;
    }

    if (input) {
      const newText = curText.slice(0, curCursor) + input + curText.slice(curCursor);
      setText(newText);
      setCursor(curCursor + input.length);
    }
  });

  const beforeCursor = text.slice(0, cursor);
  const atCursor = text[cursor] || ' ';
  const afterCursor = text.slice(cursor + 1);

  return (
    <Box flexDirection="column">
      {hasPaste && pasteInfo && (
        <Box>
          <Text backgroundColor="yellow" color="black">
            [+ pasted {pasteInfo.lines} lines]
          </Text>
        </Box>
      )}
      {hasImage && imageInfo && (
        <Box>
          <Text backgroundColor="yellow" color="black">
            [+ image {imageInfo.filename || '1'}]
          </Text>
        </Box>
      )}
      {showConfirmExit && (
        <Box>
          <Text color="yellow">[Press ESC again to quit]</Text>
        </Box>
      )}
      {showAutocomplete && (
        <Autocomplete
          commands={matches}
          selectedIndex={autocompleteIdx >= 0 ? autocompleteIdx : 0}
          filter={text}
        />
      )}
      <Box>
        <Text bold>&gt; </Text>
        <Text>
          {beforeCursor}
          {disabled ? atCursor : <Text inverse>{atCursor}</Text>}
          {afterCursor}
        </Text>
      </Box>
    </Box>
  );
}
