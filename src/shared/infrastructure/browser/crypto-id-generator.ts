import type { IdGeneratorPort } from '../../application/id-generator-port';
import {
  createAudioAssetId,
  createConversionJobId,
  createQueueId,
  type AudioAssetId,
  type ConversionJobId,
  type QueueId,
} from '../../domain/ids';

export function createCryptoAudioAssetIdGenerator(): IdGeneratorPort<AudioAssetId> {
  return {
    nextId: () => {
      const id = createAudioAssetId(crypto.randomUUID());

      if (!id.ok) {
        throw new Error('Generated invalid audio asset id.');
      }

      return id.value;
    },
  };
}

export function createCryptoConversionJobIdGenerator(): IdGeneratorPort<ConversionJobId> {
  return {
    nextId: () => {
      const id = createConversionJobId(crypto.randomUUID());

      if (!id.ok) {
        throw new Error('Generated invalid conversion job id.');
      }

      return id.value;
    },
  };
}

export function createCryptoQueueIdGenerator(): IdGeneratorPort<QueueId> {
  return {
    nextId: () => {
      const id = createQueueId(crypto.randomUUID());

      if (!id.ok) {
        throw new Error('Generated invalid queue id.');
      }

      return id.value;
    },
  };
}
