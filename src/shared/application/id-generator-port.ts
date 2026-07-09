export type IdGeneratorPort<Id> = {
  readonly nextId: () => Id;
};
