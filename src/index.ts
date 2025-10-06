import { SentinelClient } from './sentinel';
import { installFetchInterceptor } from './interceptors/fetch';
import type { SentinelConfig } from './types';

export { SentinelClient } from './sentinel';
export { installFetchInterceptor } from './interceptors/fetch';
export { installAxiosInterceptor } from './interceptors/axios';
export { IndexedDBStorage } from './storage/indexeddb';
export { ErrorUI } from './ui/error-ui';
export type { SentinelConfig, ErrorEvent, ErrorBatch, SentinelMode } from './types';

/**
 * Create and initialize a Sentinel client with fetch interceptor
 *
 * @param config - Sentinel configuration
 * @returns Configured Sentinel client
 */
export function createSentinel(config: SentinelConfig): SentinelClient {
  const client = new SentinelClient(config);

  // Auto-install fetch interceptor if enabled (default true)
  if (config.enabled !== false) {
    installFetchInterceptor(client);
  }

  return client;
}
