export interface ErrorEvent {
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: number;
  team: string;
  username?: string;
  responsePayload?: string;
}

export interface SentinelConfig {
  /**
   * Backend URL where errors will be sent
   */
  backendUrl: string;

  /**
   * Map of endpoint patterns to team names
   * Example: { '/api/users': 'platform', '/api/orders': 'commerce' }
   */
  teamMapping: Record<string, string>;

  /**
   * Enable or disable error reporting (useful for environments)
   */
  enabled: boolean;

  /**
   * Optional function to get the current username
   */
  getUserName?: () => string | undefined;

  /**
   * Batch size - send errors when this many have accumulated (default: 50)
   */
  batchSize?: number;

  /**
   * Batch interval - send errors after this many milliseconds (default: 10000)
   */
  batchInterval?: number;

  /**
   * Default team name for unmapped endpoints (default: 'unknown')
   */
  defaultTeam?: string;
}

export interface ErrorBatch {
  errors: ErrorEvent[];
}
