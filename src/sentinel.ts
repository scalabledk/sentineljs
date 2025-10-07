import { SentinelConfig, ErrorEvent, ErrorBatch } from './types';
import { IndexedDBStorage } from './storage/indexeddb';
import { ErrorUI } from './ui/error-ui';

export class SentinelClient {
  private config: Required<
    Omit<
      SentinelConfig,
      | 'backendUrl'
      | 'apiKey'
      | 'showUI'
      | 'uiPosition'
      | 'teamsChannelUrl'
      | 'teamsButtonLabel'
      | 'captureHeaders'
    >
  > & {
    backendUrl?: string;
    apiKey?: string;
    showUI?: boolean;
    uiPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    teamsChannelUrl?: string;
    teamsButtonLabel?: string;
    captureHeaders?: string[];
  };
  private errorQueue: ErrorEvent[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private storage: IndexedDBStorage | null = null;
  private ui: ErrorUI | null = null;

  constructor(config: SentinelConfig) {
    this.config = {
      ...config,
      mode: config.mode ?? 'local',
      enabled: config.enabled ?? true,
      batchSize: config.batchSize ?? 50,
      batchInterval: config.batchInterval ?? 10000,
      defaultTeam: config.defaultTeam ?? 'unknown',
      getUserName: config.getUserName ?? (() => undefined),
      dbName: config.dbName ?? 'sentinel',
      maxLocalErrors: config.maxLocalErrors ?? 1000,
      showUI: config.showUI ?? false,
      uiPosition: config.uiPosition ?? 'bottom-right',
      teamsChannelUrl: config.teamsChannelUrl,
      teamsButtonLabel: config.teamsButtonLabel,
      captureHeaders: config.captureHeaders,
    };

    // Validate remote mode configuration
    if (this.config.mode === 'remote') {
      if (!this.config.backendUrl) {
        throw new Error('backendUrl is required when mode is "remote"');
      }
      if (!this.config.apiKey) {
        throw new Error('apiKey is required when mode is "remote"');
      }
    }

    // Initialize IndexedDB storage for local mode
    if (this.config.mode === 'local' && typeof window !== 'undefined') {
      this.initStorage();
    }

    // Initialize UI for local mode if enabled
    if (this.config.mode === 'local' && this.config.showUI && typeof window !== 'undefined') {
      this.initUI();
    }
  }

  private async initStorage(): Promise<void> {
    try {
      this.storage = new IndexedDBStorage(this.config.dbName, this.config.maxLocalErrors);
      await this.storage.init();
    } catch (error) {
      console.error('[Sentinel] Failed to initialize IndexedDB:', error);
    }
  }

  private async initUI(): Promise<void> {
    try {
      this.ui = new ErrorUI({
        position: this.config.uiPosition,
        teamsChannelUrl: this.config.teamsChannelUrl,
        teamsButtonLabel: this.config.teamsButtonLabel,
      });

      // Set callback to fetch latest errors
      this.ui.setUpdateCallback(async () => {
        return await this.getLocalErrors();
      });

      // Set callback to clear errors
      this.ui.setClearCallback(async () => {
        await this.clearLocalErrors();
      });

      this.ui.init();

      // Check if there are existing errors and show UI if there are
      const errors = await this.getLocalErrors();
      if (errors.length > 0) {
        this.ui.show();
      }
    } catch (error) {
      console.error('[Sentinel] Failed to initialize UI:', error);
    }
  }

  /**
   * Report an error to Sentinel
   */
  reportError(
    endpoint: string,
    method: string,
    statusCode: number,
    responsePayload?: string,
    headers?: Record<string, string>,
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const team = this.getTeamForEndpoint(endpoint);

    // Only capture errors for endpoints that match team mappings
    // Skip if team is default team (no mapping found)
    if (team === this.config.defaultTeam) {
      return;
    }

    const username = this.config.getUserName();

    const error: ErrorEvent = {
      endpoint,
      method,
      statusCode,
      timestamp: Date.now(),
      team,
      ...(username && { username }),
      ...(responsePayload && { responsePayload }),
      ...(headers && Object.keys(headers).length > 0 && { headers }),
    };

    if (this.config.mode === 'local') {
      // Store in IndexedDB
      this.storeErrorLocally(error);

      // Show UI button if it exists and is hidden
      if (this.ui) {
        this.ui.show();
      }
    } else {
      // Queue for remote batch sending
      this.errorQueue.push(error);

      // Send immediately if batch size reached
      if (this.errorQueue.length >= this.config.batchSize) {
        this.flush();
      } else {
        // Schedule batch send
        this.scheduleBatchSend();
      }
    }
  }

  /**
   * Store error in IndexedDB (local mode)
   */
  private async storeErrorLocally(error: ErrorEvent): Promise<void> {
    if (!this.storage) {
      console.error('[Sentinel] Storage not initialized');
      return;
    }

    try {
      await this.storage.storeError(error);
    } catch (err) {
      console.error('[Sentinel] Failed to store error locally:', err);
    }
  }

  /**
   * Get all locally stored errors
   */
  async getLocalErrors(): Promise<ErrorEvent[]> {
    if (this.config.mode !== 'local' || !this.storage) {
      return [];
    }

    try {
      return await this.storage.getAllErrors();
    } catch (err) {
      console.error('[Sentinel] Failed to retrieve local errors:', err);
      return [];
    }
  }

  /**
   * Clear all locally stored errors
   */
  async clearLocalErrors(): Promise<void> {
    if (this.config.mode !== 'local' || !this.storage) {
      return;
    }

    try {
      await this.storage.clearAll();
    } catch (err) {
      console.error('[Sentinel] Failed to clear local errors:', err);
    }
  }

  /**
   * Export locally stored errors as JSON
   */
  async exportLocalErrors(): Promise<string> {
    const errors = await this.getLocalErrors();
    return JSON.stringify(errors, null, 2);
  }

  /**
   * Manually flush all queued errors
   */
  flush(): void {
    if (this.errorQueue.length === 0) {
      return;
    }

    const batch: ErrorBatch = {
      errors: [...this.errorQueue],
    };

    this.errorQueue = [];
    this.clearBatchTimer();

    // Send to backend (don't await to avoid blocking)
    this.sendBatch(batch).catch((err) => {
      // Silently fail - we don't want error reporting to break the app
      console.error('[Sentinel] Failed to send error batch:', err);
    });
  }

  /**
   * Get the team responsible for an endpoint
   */
  private getTeamForEndpoint(endpoint: string): string {
    // Try exact match first
    if (this.config.teamMapping[endpoint]) {
      return this.config.teamMapping[endpoint];
    }

    // Try prefix and regex matching
    for (const [pattern, team] of Object.entries(this.config.teamMapping)) {
      // Check if pattern is a regex (starts with / and ends with /)
      if (pattern.startsWith('/') && pattern.endsWith('/')) {
        try {
          const regexPattern = pattern.slice(1, -1); // Remove leading and trailing /
          const regex = new RegExp(regexPattern);
          if (regex.test(endpoint)) {
            return team;
          }
        } catch {
          // Invalid regex, skip
          console.warn(`[Sentinel] Invalid regex pattern: ${pattern}`);
        }
      }
      // Check if pattern is a full URL (starts with http:// or https://)
      else if (pattern.startsWith('http://') || pattern.startsWith('https://')) {
        if (this.matchesUrlPattern(endpoint, pattern)) {
          return team;
        }
      }
      // Otherwise try prefix matching (for paths)
      else if (endpoint.startsWith(pattern)) {
        return team;
      }
    }

    return this.config.defaultTeam;
  }

  /**
   * Match endpoint against URL pattern with optional TLD variation support
   * TLD variation is enabled by using [tld] placeholder in hostname (e.g., https://api.example.[tld]/users)
   */
  private matchesUrlPattern(endpoint: string, pattern: string): boolean {
    try {
      // Check if TLD variation is requested (pattern contains [tld])
      const tldVariation = pattern.includes('[tld]');

      // For TLD variation, we need to extract the base domain from pattern
      let patternHostname: string;
      let patternPath: string;

      if (tldVariation) {
        // Extract protocol
        const protocolMatch = pattern.match(/^(https?):\/\//);
        if (!protocolMatch) {
          return false;
        }

        // Extract hostname and path parts
        const withoutProtocol = pattern.substring(protocolMatch[0].length);
        const slashIndex = withoutProtocol.indexOf('/');
        const hostnameWithTld =
          slashIndex >= 0 ? withoutProtocol.substring(0, slashIndex) : withoutProtocol;
        patternPath = slashIndex >= 0 ? withoutProtocol.substring(slashIndex) : '/';

        // Extract base domain (everything before [tld])
        patternHostname = hostnameWithTld.replace('[tld]', '');
      } else {
        // Parse as normal URL
        const patternUrl = new URL(pattern);
        patternHostname = patternUrl.hostname;
        patternPath = patternUrl.pathname;
      }

      // Try to construct full URL from endpoint
      let endpointUrl: URL;
      try {
        endpointUrl = new URL(
          endpoint,
          typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
        );
      } catch {
        // If endpoint is just a path, combine with current origin
        if (typeof window !== 'undefined') {
          endpointUrl = new URL(endpoint, window.location.origin);
        } else {
          // In Node.js context, can't match full URLs
          return false;
        }
      }

      const endpointHostname = endpointUrl.hostname;
      const endpointPath = endpointUrl.pathname;

      // Check if path matches
      if (!endpointPath.startsWith(patternPath)) {
        return false;
      }

      // Check hostname
      if (tldVariation) {
        // TLD variation enabled: check if endpoint hostname starts with pattern base
        // and has the same structure (same number of dots before the TLD placeholder position)
        // For example: api.example.[tld] should match api.example.com, api.example.dk, api.example.co.uk

        // Remove trailing dot from pattern if present
        const cleanPatternHostname = patternHostname.replace(/\.$/, '');

        // Count dots in cleaned pattern
        const patternDots = (cleanPatternHostname.match(/\./g) || []).length;
        const endpointParts = endpointHostname.split('.');

        // Endpoint must have at least patternDots + 1 parts (for the TLD)
        if (endpointParts.length <= patternDots) {
          return false;
        }

        // Compare the non-TLD parts (everything before the TLD)
        const endpointBase = endpointParts.slice(0, patternDots + 1).join('.');
        return endpointBase === cleanPatternHostname;
      }

      // Exact hostname match (default)
      return patternHostname === endpointHostname;
    } catch {
      return false;
    }
  }

  /**
   * Schedule a batch send after the configured interval
   */
  private scheduleBatchSend(): void {
    if (this.batchTimer !== null) {
      return; // Timer already scheduled
    }

    this.batchTimer = setTimeout(() => {
      this.flush();
    }, this.config.batchInterval);
  }

  /**
   * Clear the batch timer
   */
  private clearBatchTimer(): void {
    if (this.batchTimer !== null) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
  }

  /**
   * Send error batch to backend
   */
  private async sendBatch(batch: ErrorBatch): Promise<void> {
    if (!this.config.backendUrl) {
      throw new Error('Backend URL not configured');
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key if configured
      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(`${this.config.backendUrl}/errors`, {
        method: 'POST',
        headers,
        body: JSON.stringify(batch),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Re-throw to be caught by caller
      throw error;
    }
  }

  /**
   * Get the list of headers to capture from responses
   */
  getCaptureHeaders(): string[] | undefined {
    return this.config.captureHeaders;
  }

  /**
   * Destroy the Sentinel client and clean up resources
   */
  destroy(): void {
    // Clean up UI
    if (this.ui) {
      this.ui.destroy();
      this.ui = null;
    }

    // Clean up storage
    if (this.storage) {
      this.storage.close();
      this.storage = null;
    }

    // Clean up batch timer
    this.clearBatchTimer();

    // Clear error queue
    this.errorQueue = [];
  }
}
