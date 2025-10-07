export interface ErrorEvent {
  endpoint: string;
  method: string;
  statusCode: number;
  timestamp: number;
  team: string;
  username?: string;
  responsePayload?: string;
  headers?: Record<string, string>;
}

export type SentinelMode = 'local' | 'remote';

export interface SentinelConfig {
  /**
   * Operating mode:
   * - 'local': Store errors in browser IndexedDB (no server needed)
   * - 'remote': Send errors to sentinel-server (requires backendUrl and apiKey)
   * Default: 'local'
   */
  mode?: SentinelMode;

  /**
   * Backend URL where errors will be sent (required for 'remote' mode)
   */
  backendUrl?: string;

  /**
   * API key for authenticating with sentinel-server (required for 'remote' mode)
   */
  apiKey?: string;

  /**
   * Map of endpoint patterns to team names
   * Example: { '/api/users': 'platform', '/api/orders': 'commerce' }
   */
  teamMapping: Record<string, string>;

  /**
   * Enable or disable error reporting (useful for environments)
   * Default: true
   */
  enabled?: boolean;

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

  /**
   * IndexedDB database name (default: 'sentinel')
   */
  dbName?: string;

  /**
   * Maximum number of errors to store locally (default: 1000)
   */
  maxLocalErrors?: number;

  /**
   * Show UI for local mode (default: false)
   * Only available in 'local' mode
   */
  showUI?: boolean;

  /**
   * UI position on screen (default: 'bottom-right')
   */
  uiPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';

  /**
   * Microsoft Teams channel URL for sending error notifications
   * Example: 'https://teams.microsoft.com/l/channel/19%3a...thread.tacv2/General?groupId=...&tenantId=...'
   */
  teamsChannelUrl?: string;

  /**
   * Custom label for the Teams button (default: 'Send to Teams')
   * Example: 'Visit our Teams channel', 'Report to Support'
   * Only used when teamsChannelUrl is provided
   */
  teamsButtonLabel?: string;

  /**
   * Array of header names to capture from HTTP responses
   * Example: ['x-correlation-id', 'x-request-id', 'x-trace-id']
   * Headers will be included in error reports if present
   */
  captureHeaders?: string[];

  /**
   * Deduplication window in milliseconds (default: 60000)
   * Errors with the same endpoint, method, status code, and team within this window will be deduplicated
   * Set to 0 to disable deduplication
   * Example: 30000 (30 seconds), 120000 (2 minutes)
   */
  deduplicationWindow?: number;
}

export interface ErrorBatch {
  errors: ErrorEvent[];
}
