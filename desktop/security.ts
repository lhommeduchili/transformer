import { extname, isAbsolute, normalize, relative, resolve } from 'node:path';

export function resolvePackagedAsset(webRoot: string, pathname: string): string | undefined {
  const requestedPath = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  if (requestedPath.split('/').includes('..')) return undefined;

  const filePath = resolve(webRoot, `.${normalize(requestedPath)}`);
  const relativePath = relative(webRoot, filePath);

  return relativePath.startsWith('..') || isAbsolute(relativePath) ? undefined : filePath;
}

export function parseDesktopWriteRequest(request: unknown): {
  readonly token: string;
  readonly fileName: string;
  readonly data: Uint8Array;
} {
  if (typeof request !== 'object' || request === null) throw new Error('Invalid output request.');

  const record = request as Record<string, unknown>;
  const { token, fileName, data } = record;
  if (typeof token !== 'string' || !isSafeFileName(fileName) || !(data instanceof ArrayBuffer)) {
    throw new Error('Invalid output request.');
  }

  return { token, fileName, data: new Uint8Array(data) };
}

export function nextOutputCandidate(requestedName: string, suffix: number): string {
  const extension = extname(requestedName);
  const baseName =
    extension.length === 0 ? requestedName : requestedName.slice(0, -extension.length);
  return `${baseName}-${suffix}${extension}`;
}

function isSafeFileName(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    value !== '.' &&
    value !== '..' &&
    !value.includes('/') &&
    !value.includes('\\') &&
    !value.includes('\0')
  );
}
