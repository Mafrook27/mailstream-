import { Contact } from '../types';

export function replaceVars(text: string, contact: Contact | null): string {
  if (!contact || !text) return text;
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    if (contact[trimmedKey] !== undefined) {
      const val = contact[trimmedKey];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    }
    return match;
  });
}

/**
 * Parses Spintax formatted strings.
 * Example: "{Hi|Hello|Hey} there!" -> Randomly selects one option.
 * It requires at least one pipe '|' inside the braces to avoid colliding with {{Variables}}.
 */
export function parseSpintax(text: string): string {
  if (!text) return text;
  let result = text;
  // Matches {A|B} or {A|B|C}, ensuring at least one pipe is present and no nested braces.
  const spintaxRegex = /\{([^{}]*\|[^{}]*)\}/g;
  let match;
  
  // We use a loop to handle multiple spintax blocks in the same string
  while ((match = spintaxRegex.exec(result)) !== null) {
    const options = match[1].split('|');
    const randomOption = options[Math.floor(Math.random() * options.length)];
    result = result.substring(0, match.index) + randomOption + result.substring(match.index + match[0].length);
    spintaxRegex.lastIndex = 0; // Reset because string length changed
  }
  return result;
}

export function processTemplate(text: string, contact: Contact | null): string {
  const withVars = replaceVars(text, contact);
  return parseSpintax(withVars);
}
