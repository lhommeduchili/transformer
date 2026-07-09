import type { FilenamePolicy } from './filename-policy';

export type SanitizedFilename = {
  readonly baseName: string;
  readonly changed: boolean;
};

export function sanitizeFilenameBase(
  inputName: string,
  policy: FilenamePolicy,
  fallbackBaseName: string,
): SanitizedFilename {
  const originalBase = stripExtension(inputName);
  const replacement = policy.replacement;
  let sanitized = removeControlCharacters(originalBase)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]/g, replacement)
    .replace(/\s+/g, ' ')
    .trim();

  if (policy.asciiOnly) {
    sanitized = sanitized.replace(/[^\x20-\x7e]/g, '');
  }

  sanitized = sanitized
    .replace(new RegExp(`${escapeRegExp(replacement)}{2,}`, 'g'), replacement)
    .replace(
      new RegExp(
        `^(?:\\s*${escapeRegExp(replacement)}\\s*)+|(?:\\s*${escapeRegExp(replacement)}\\s*)+$`,
        'g',
      ),
      '',
    )
    .trim();

  if (sanitized.length === 0) {
    sanitized = fallbackBaseName;
  }

  if (sanitized.length > policy.maxLength) {
    sanitized = sanitized.slice(0, policy.maxLength).trim();
  }

  return { baseName: sanitized, changed: sanitized !== originalBase };
}

export function stripExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');

  if (lastDot <= 0) {
    return fileName;
  }

  return fileName.slice(0, lastDot);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeControlCharacters(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);

      return code > 31 && code !== 127;
    })
    .join('');
}
