import { stripMarkdown } from './downloadUtils';

export function cleanMarkdown(text) {
  if (!text || typeof text !== 'string') return '';
  return stripMarkdown(text)
    .replace(/\[add[^\]]*\]/gi, '')
    .replace(/\[insert[^\]]*\]/gi, '')
    .replace(/\[your[^\]]*\]/gi, '')
    .replace(/\[füge[^\]]*\]/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
