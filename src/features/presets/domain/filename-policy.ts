export type FilenamePolicy = {
  readonly mode: 'preserve' | 'sanitize';
  readonly asciiOnly: boolean;
  readonly replacement: '-' | '_';
  readonly maxLength: number;
};

export const cdjSafeFilenamePolicy: FilenamePolicy = {
  mode: 'sanitize',
  asciiOnly: true,
  replacement: '-',
  maxLength: 120,
};
