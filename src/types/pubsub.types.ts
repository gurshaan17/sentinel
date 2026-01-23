import type { ClassifiedLog } from './log.types';

export interface PubSubMessage {
  id: string;
  log: ClassifiedLog;
  publishedAt: Date;
  attributes: {
    severity: string;
    containerId: string;
    containerName: string;
  };
}

export interface PublishOptions {
  orderingKey?: string;
  attributes?: Record<string, string>;
}