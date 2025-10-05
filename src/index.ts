import { SentinelClient } from './sentinel';
import { installFetchInterceptor } from './interceptors/fetch';
import type { SentinelConfig } from './types';

export { SentinelClient } from './sentinel';
export { installFetchInterceptor } from './interceptors/fetch';
export { installAxiosInterceptor } from './interceptors/axios';
export type { SentinelConfig, ErrorEvent, ErrorBatch } from './types';

/**
 * Create and initialize a Sentinel client with fetch interceptor
 *
 * @param config - Sentinel configuration
 * @returns Configured Sentinel client
 */
export function createSentinel(config: SentinelConfig): SentinelClient {
  const client = new SentinelClient(config);

  // Auto-install fetch interceptor if enabled
  if (config.enabled) {
    installFetchInterceptor(client);
  }

  return client;
}
