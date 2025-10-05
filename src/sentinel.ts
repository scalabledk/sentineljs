import { SentinelConfig, ErrorEvent, ErrorBatch } from './types';

export class SentinelClient {
  private config: Required<SentinelConfig>;
  private errorQueue: ErrorEvent[] = [];
  private batchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SentinelConfig) {
    this.config = {
      ...config,
      batchSize: config.batchSize ?? 50,
      batchInterval: config.batchInterval ?? 10000,
      defaultTeam: config.defaultTeam ?? 'unknown',
      getUserName: config.getUserName ?? (() => undefined),
    };
  }

  /**
   * Report an error to Sentinel
   */
  reportError(
    endpoint: string,
    method: string,
    statusCode: number,
    responsePayload?: string
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const team = this.getTeamForEndpoint(endpoint);
    const username = this.config.getUserName();

    const error: ErrorEvent = {
      endpoint,
      method,
      statusCode,
      timestamp: Date.now(),
      team,
      ...(username && { username }),
      ...(responsePayload && { responsePayload }),
    };

    this.errorQueue.push(error);

    // Send immediately if batch size reached
    if (this.errorQueue.length >= this.config.batchSize) {
      this.flush();
    } else {
      // Schedule batch send
      this.scheduleBatchSend();
    }
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

    // Try prefix matching
    for (const [pattern, team] of Object.entries(this.config.teamMapping)) {
      if (endpoint.startsWith(pattern)) {
        return team;
      }
    }

    return this.config.defaultTeam;
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
    try {
      const response = await fetch(`${this.config.backendUrl}/errors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
}
