export function nextAvailableFilename(
  requestedName: string,
  exists: (candidate: string) => boolean,
): string {
  if (!exists(requestedName)) {
    return requestedName;
  }

  const lastDot = requestedName.lastIndexOf('.');
  const baseName = lastDot > 0 ? requestedName.slice(0, lastDot) : requestedName;
  const extension = lastDot > 0 ? requestedName.slice(lastDot) : '';
  let index = 2;

  while (exists(`${baseName}-${index}${extension}`)) {
    index += 1;
  }

  return `${baseName}-${index}${extension}`;
}
