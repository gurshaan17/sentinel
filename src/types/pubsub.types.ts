import type { ClassifiedLog } from './log.types';

export interface PubSubMessage {
  id: string;
  log: ClassifiedLog;
  publishedAt: string;
}

export interface PublishOptions {
  orderingKey?: string;
  attributes?: Record<string, string>;
}