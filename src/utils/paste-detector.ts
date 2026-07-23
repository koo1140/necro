import type { InputPaste } from '../types/index.js';

const IMAGE_EXTENSIONS = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i;
const BASE64_IMAGE_PREFIX = /^data:image\//;

export function detectPaste(text: string): InputPaste | null {
  const lines = text.split('\n');
  if (lines.length >= 10) {
    return {
      type: 'text',
      content: text,
      lines: lines.length,
    };
  }
  return null;
}

export function detectImagePaste(text: string): InputPaste | null {
  const trimmed = text.trim();

  if (BASE64_IMAGE_PREFIX.test(trimmed)) {
    return {
      type: 'image',
      content: trimmed,
    };
  }

  if (IMAGE_EXTENSIONS.test(trimmed)) {
    return {
      type: 'image',
      content: trimmed,
      filename: trimmed.split(/[/\\]/).pop(),
    };
  }

  return null;
}
