export type MetadataPolicy =
  | { readonly mode: 'preserve' }
  | { readonly mode: 'strip_unsupported' }
  | { readonly mode: 'minimal'; readonly fields: readonly MetadataField[] };

export type MetadataField = 'title' | 'artist' | 'album' | 'year' | 'genre' | 'trackNumber';
