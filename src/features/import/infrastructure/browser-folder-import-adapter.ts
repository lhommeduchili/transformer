type BrowserFileEntry = {
  readonly isFile: true;
  readonly isDirectory: false;
  readonly file: (success: (file: File) => void, failure?: (error: DOMException) => void) => void;
};

type BrowserDirectoryEntry = {
  readonly isFile: false;
  readonly isDirectory: true;
  readonly createReader: () => {
    readonly readEntries: (
      success: (entries: readonly BrowserFileSystemEntry[]) => void,
      failure?: (error: DOMException) => void,
    ) => void;
  };
};

type BrowserFileSystemEntry = BrowserFileEntry | BrowserDirectoryEntry;

type EntryDataTransferItem = {
  readonly kind: string;
  readonly webkitGetAsEntry?: () => BrowserFileSystemEntry | null;
};

export async function filesFromDataTransfer(dataTransfer: DataTransfer): Promise<readonly File[]> {
  const entries = Array.from(dataTransfer.items)
    .filter((item) => item.kind === 'file')
    .map((item) => (item as unknown as EntryDataTransferItem).webkitGetAsEntry?.())
    .filter((entry): entry is BrowserFileSystemEntry => entry !== null && entry !== undefined);

  if (entries.length === 0) {
    return Array.from(dataTransfer.files);
  }

  const files: File[] = [];
  for (const entry of entries) {
    try {
      files.push(...(await filesFromEntry(entry)));
    } catch {
      continue;
    }
  }
  return files;
}

async function filesFromEntry(entry: BrowserFileSystemEntry): Promise<readonly File[]> {
  if (entry.isFile) {
    return [await fileFromEntry(entry)];
  }

  const files: File[] = [];
  for (const child of await allDirectoryEntries(entry)) {
    files.push(...(await filesFromEntry(child)));
  }
  return files;
}

function fileFromEntry(entry: BrowserFileEntry): Promise<File> {
  return new Promise((resolve, reject) => entry.file(resolve, reject));
}

async function allDirectoryEntries(
  entry: BrowserDirectoryEntry,
): Promise<readonly BrowserFileSystemEntry[]> {
  const reader = entry.createReader();
  const entries: BrowserFileSystemEntry[] = [];

  while (true) {
    const batch = await new Promise<readonly BrowserFileSystemEntry[]>((resolve, reject) =>
      reader.readEntries(resolve, reject),
    );
    if (batch.length === 0) return entries;
    entries.push(...batch);
  }
}
