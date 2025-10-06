import { ErrorEvent } from '../types';

interface UIConfig {
  teamsChannelUrl?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  422: 'Unprocessable Entity',
  429: 'Too Many Requests',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
};

export class ErrorUI {
  private container: HTMLElement | null = null;
  private config: UIConfig;
  private isOpen = false;
  private updateCallback: (() => Promise<ErrorEvent[]>) | null = null;
  private clearCallback: (() => Promise<void>) | null = null;

  constructor(config: UIConfig = {}) {
    this.config = {
      position: config.position || 'bottom-right',
      teamsChannelUrl: config.teamsChannelUrl,
    };
  }

  /**
   * Set callback to get latest errors
   */
  setUpdateCallback(callback: () => Promise<ErrorEvent[]>): void {
    this.updateCallback = callback;
  }

  /**
   * Set callback to clear errors
   */
  setClearCallback(callback: () => Promise<void>): void {
    this.clearCallback = callback;
  }

  /**
   * Initialize and render the UI
   */
  init(): void {
    if (typeof window === 'undefined') {
      console.warn('[Sentinel UI] Not available in SSR environment');
      return;
    }

    // Check if already initialized (for React StrictMode)
    const existingContainer = document.getElementById('sentinel-ui-toggle-container');
    if (existingContainer) {
      return;
    }

    // Create toggle button
    this.createToggleButton();
  }

  /**
   * Create floating action button to toggle UI
   */
  private createToggleButton(): void {
    // Create container for button and label
    const container = document.createElement('div');
    container.id = 'sentinel-ui-toggle-container';

    // Style container
    Object.assign(container.style, {
      position: 'fixed',
      ...this.getPositionStyles(),
      zIndex: '999999',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      transition: 'all 0.3s ease',
    });

    // Create button
    const button = document.createElement('button');
    button.id = 'sentinel-ui-toggle';
    button.innerHTML = '⚠️';
    button.title = 'View Sentinel Errors';

    // Style the button
    Object.assign(button.style, {
      width: '56px',
      height: '56px',
      borderRadius: '50%',
      border: 'none',
      backgroundColor: '#dc3545',
      color: 'white',
      fontSize: '24px',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s ease',
      flexShrink: '0',
    });

    // Create label
    const label = document.createElement('div');
    label.id = 'sentinel-ui-label';
    label.innerHTML = '<strong>Click to view errors</strong>';
    label.style.cssText = `
      background: #dc3545;
      color: white;
      padding: 10px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.3s ease;
    `;

    container.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      label.style.transform = 'translateY(-2px)';
      label.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
    });

    container.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      label.style.transform = 'translateY(0)';
      label.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
    });

    container.addEventListener('click', () => {
      this.toggleUI();
    });

    // Add pulsing animation to make it more noticeable
    const pulse = document.createElement('style');
    pulse.textContent = `
      @keyframes sentinel-pulse {
        0%, 100% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 0 rgba(220, 53, 69, 0.7); }
        50% { box-shadow: 0 4px 8px rgba(0,0,0,0.3), 0 0 0 10px rgba(220, 53, 69, 0); }
      }
      #sentinel-ui-toggle {
        animation: sentinel-pulse 2s infinite;
      }
    `;
    document.head.appendChild(pulse);

    container.appendChild(button);
    container.appendChild(label);
    document.body.appendChild(container);
  }

  /**
   * Get position styles based on config
   */
  private getPositionStyles(): Record<string, string> {
    const offset = '20px';
    const positions = {
      'bottom-right': { bottom: offset, right: offset },
      'bottom-left': { bottom: offset, left: offset },
      'top-right': { top: offset, right: offset },
      'top-left': { top: offset, left: offset },
    };

    return positions[this.config.position!];
  }

  /**
   * Toggle the UI visibility
   */
  private async toggleUI(): Promise<void> {
    if (this.isOpen) {
      this.closeUI();
    } else {
      await this.openUI();
    }
  }

  /**
   * Open and render the UI
   */
  private async openUI(): Promise<void> {
    this.isOpen = true;

    // Get latest errors
    const errors = this.updateCallback ? await this.updateCallback() : [];

    // Create container
    this.container = document.createElement('div');
    this.container.id = 'sentinel-ui-container';

    // Style container
    Object.assign(this.container.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: '1200px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      zIndex: '1000000',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    });

    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'sentinel-ui-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: '999999',
    });
    backdrop.addEventListener('click', () => this.closeUI());

    // Render content
    this.container.innerHTML = this.renderContent(errors);

    // Add to DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(this.container);

    // Attach event listeners (must be after adding to DOM)
    this.attachEventListeners(errors);
  }

  /**
   * Close the UI
   */
  private closeUI(): void {
    this.isOpen = false;

    const backdrop = document.getElementById('sentinel-ui-backdrop');
    if (backdrop) {
      backdrop.remove();
    }

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Render the UI content
   */
  private renderContent(errors: ErrorEvent[]): string {
    const groupedErrors = this.groupErrorsByTeam(errors);

    return `
      <div style="padding: 24px; border-bottom: 1px solid #e0e0e0; background: #f8f9fa;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h2 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 600; color: #212529;">
              Sentinel Error Monitor
            </h2>
            <p style="margin: 0; color: #6c757d; font-size: 14px;">
              ${errors.length} error(s) tracked locally
            </p>
          </div>
          <button id="sentinel-close-btn" style="
            background: none;
            border: none;
            font-size: 28px;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">×</button>
        </div>
      </div>

      <div style="padding: 24px; overflow-y: auto; flex: 1;">
        ${errors.length === 0 ? this.renderEmptyState() : ''}

        ${Object.entries(groupedErrors)
          .map(([team, teamErrors]) => this.renderTeamSection(team, teamErrors))
          .join('')}
      </div>

      <div style="padding: 16px 24px; border-top: 1px solid #e0e0e0; background: #f8f9fa;">
        <div style="display: flex; gap: 12px; align-items: center;">
          ${this.hasAnyTeamsUrl() ? `
            <button id="sentinel-send-all-btn" style="
              padding: 8px 16px;
              background: #5b5fc7;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
              display: flex;
              align-items: center;
              gap: 6px;
            ">
              <span>📤</span>
              Send All to Teams
            </button>
          ` : ''}

          <button id="sentinel-copy-all-btn" style="
            padding: 8px 16px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
          ">
            <span>📋</span>
            Copy All Errors
          </button>

          <button id="sentinel-refresh-btn" style="
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Refresh</button>

          <button id="sentinel-clear-btn" style="
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
          ">Clear All</button>

          <div style="flex: 1;"></div>

          <span style="color: #6c757d; font-size: 12px;">
            Press ESC to close
          </span>
        </div>
      </div>
    `;
  }

  /**
   * Check if Teams URL is configured
   */
  private hasAnyTeamsUrl(): boolean {
    return !!this.config.teamsChannelUrl;
  }

  /**
   * Generate a correlation ID for tracing
   */
  private generateCorrelationId(): string {
    return `sentinel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): string {
    return `
      <div style="text-align: center; padding: 60px 20px; color: #6c757d;">
        <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
        <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">No errors tracked</h3>
        <p style="margin: 0; font-size: 14px;">Errors will appear here when they occur</p>
      </div>
    `;
  }

  /**
   * Group errors by team
   */
  private groupErrorsByTeam(
    errors: ErrorEvent[]
  ): Record<string, ErrorEvent[]> {
    return errors.reduce(
      (acc, error) => {
        if (!acc[error.team]) {
          acc[error.team] = [];
        }
        acc[error.team].push(error);
        return acc;
      },
      {} as Record<string, ErrorEvent[]>
    );
  }

  /**
   * Render a team section
   */
  private renderTeamSection(team: string, errors: ErrorEvent[]): string {

    return `
      <div style="margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #212529;">
            ${this.escapeHtml(team)} (${errors.length})
          </h3>
        </div>

        <div style="background: white; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f9fa;">
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Endpoint</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Method</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Status</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Status Message</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Time</th>
                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6c757d; border-bottom: 1px solid #e0e0e0;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${errors.map((error, index) => this.renderErrorRow(error, team, index)).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /**
   * Render a single error row
   */
  private renderErrorRow(
    error: ErrorEvent,
    team: string,
    index: number
  ): string {
    const statusMessage =
      HTTP_STATUS_MESSAGES[error.statusCode] || 'Unknown Error';
    const timestamp = new Date(error.timestamp).toLocaleString();

    return `
      <tr style="border-bottom: 1px solid #e0e0e0;">
        <td style="padding: 12px; font-size: 13px; color: #212529; font-family: monospace;">${this.escapeHtml(error.endpoint)}</td>
        <td style="padding: 12px; font-size: 13px;">
          <span style="
            padding: 4px 8px;
            background: #e7f3ff;
            color: #0066cc;
            border-radius: 3px;
            font-weight: 600;
            font-size: 11px;
          ">${this.escapeHtml(error.method)}</span>
        </td>
        <td style="padding: 12px; font-size: 13px;">
          <span style="
            padding: 4px 8px;
            background: #ffe5e5;
            color: #cc0000;
            border-radius: 3px;
            font-weight: 600;
            font-size: 11px;
          ">${error.statusCode}</span>
        </td>
        <td style="padding: 12px; font-size: 13px; color: #212529;">${this.escapeHtml(statusMessage)}</td>
        <td style="padding: 12px; font-size: 12px; color: #6c757d;">${timestamp}</td>
        <td style="padding: 12px;">
          <button class="sentinel-copy-btn" data-team="${this.escapeHtml(team)}" data-index="${index}" style="
            padding: 6px 12px;
            background: #28a745;
            color: white;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
          ">Copy Details</button>
        </td>
      </tr>
    `;
  }

  /**
   * Attach event listeners to interactive elements
   */
  private attachEventListeners(errors: ErrorEvent[]): void {
    // Close button
    const closeBtn = document.getElementById('sentinel-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeUI());
    }

    // ESC key to close
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.closeUI();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Send All to Teams button
    const sendAllBtn = document.getElementById('sentinel-send-all-btn');
    if (sendAllBtn) {
      sendAllBtn.addEventListener('click', () => {
        this.sendAllToTeams(errors);
      });
    }

    // Copy All button
    const copyAllBtn = document.getElementById('sentinel-copy-all-btn');
    if (copyAllBtn) {
      copyAllBtn.addEventListener('click', async () => {
        await this.copyAllErrors(errors);
        copyAllBtn.innerHTML = '<span>✓</span> Copied!';
        (copyAllBtn as HTMLButtonElement).style.background = '#17a2b8';
        setTimeout(() => {
          copyAllBtn.innerHTML = '<span>📋</span> Copy All Errors';
          (copyAllBtn as HTMLButtonElement).style.background = '#28a745';
        }, 2000);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('sentinel-refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        this.closeUI();
        await this.openUI();
      });
    }

    // Clear button
    const clearBtn = document.getElementById('sentinel-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (
          confirm(
            'Are you sure you want to clear all tracked errors? This cannot be undone.'
          )
        ) {
          // Trigger clear callback if provided
          if (this.clearCallback) {
            await this.clearCallback();
          }
          this.closeUI();
          await this.openUI();
        }
      });
    }

    // Copy buttons
    const copyBtns = document.querySelectorAll('.sentinel-copy-btn');
    copyBtns.forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const target = e.target as HTMLButtonElement;
        const team = target.dataset.team!;
        const index = parseInt(target.dataset.index!);

        const groupedErrors = this.groupErrorsByTeam(errors);
        const error = groupedErrors[team][index];

        if (error) {
          await this.copyErrorDetails(error);
          target.textContent = 'Copied!';
          target.style.background = '#17a2b8';
          setTimeout(() => {
            target.textContent = 'Copy Details';
            target.style.background = '#28a745';
          }, 2000);
        }
      });
    });

  }

  /**
   * Send all errors to Teams
   * Opens a dialog to select which team's channel to send to
   */
  private sendAllToTeams(errors: ErrorEvent[]): void {
    if (errors.length === 0) {
      return;
    }

    if (!this.config.teamsChannelUrl) {
      alert('No Teams channel URL configured.');
      return;
    }

    this.sendAllErrorsToTeam(errors);
  }

  /**
   * Send all errors to Teams channel
   */
  private sendAllErrorsToTeam(errors: ErrorEvent[]): void {
    const teamsUrl = this.config.teamsChannelUrl;
    if (!teamsUrl) {
      return;
    }

    // Group errors by team for the message
    const groupedErrors = this.groupErrorsByTeam(errors);

    // Get all unique teams for tagging
    const allTeams = Object.keys(groupedErrors);
    const teamTags = allTeams.map(t => `@${t}`).join(' ');

    // Build JSON object with all errors grouped by team
    const errorsJson: Record<string, any[]> = {};

    for (const [errorTeam, teamErrors] of Object.entries(groupedErrors)) {
      errorsJson[errorTeam] = teamErrors.map((error) => {
        const statusMessage =
          HTTP_STATUS_MESSAGES[error.statusCode] || 'Unknown Error';

        const errorData: any = {
          endpoint: error.endpoint,
          method: error.method,
          statusCode: error.statusCode,
          statusMessage: statusMessage,
          timestamp: new Date(error.timestamp).toISOString(),
          username: error.username || 'unknown',
          correlationId: this.generateCorrelationId(),
          responsePayload: error.responsePayload || null,
        };

        // Add headers if present
        if (error.headers && Object.keys(error.headers).length > 0) {
          errorData.headers = error.headers;
        }

        return errorData;
      });
    }

    // Construct the message with team tags and JSON code block
    const message = `${teamTags}

\`\`\`json
${JSON.stringify(errorsJson, null, 2)}
\`\`\``;

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Construct Teams deep link
    const teamsDeepLink = teamsUrl.includes('?')
      ? `${teamsUrl}&message=${encodedMessage}`
      : `${teamsUrl}?message=${encodedMessage}`;

    // Open Teams with pre-filled message
    window.open(teamsDeepLink, '_blank');
  }

  /**
   * Copy error details to clipboard
   */
  private async copyErrorDetails(error: ErrorEvent): Promise<void> {
    const statusMessage =
      HTTP_STATUS_MESSAGES[error.statusCode] || 'Unknown Error';

    // Generate correlation ID
    const correlationId = this.generateCorrelationId();

    // Construct JSON payload
    const errorJson: any = {
      endpoint: error.endpoint,
      method: error.method,
      statusCode: error.statusCode,
      statusMessage: statusMessage,
      timestamp: new Date(error.timestamp).toISOString(),
      team: error.team,
      username: error.username || 'unknown',
      correlationId: correlationId,
      responsePayload: error.responsePayload || null,
    };

    // Add headers if present
    if (error.headers && Object.keys(error.headers).length > 0) {
      errorJson.headers = error.headers;
    }

    // Construct markdown format with team tag and JSON code block
    const text = `@${error.team}

\`\`\`json
${JSON.stringify(errorJson, null, 2)}
\`\`\``;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('[Sentinel UI] Failed to copy to clipboard:', err);
      // Fallback: create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Copy all errors to clipboard
   */
  private async copyAllErrors(errors: ErrorEvent[]): Promise<void> {
    if (errors.length === 0) {
      return;
    }

    // Group errors by team
    const groupedErrors = this.groupErrorsByTeam(errors);

    // Get all unique teams for tagging
    const allTeams = Object.keys(groupedErrors);
    const teamTags = allTeams.map(t => `@${t}`).join(' ');

    // Build JSON object with all errors grouped by team
    const errorsJson: Record<string, any[]> = {};

    for (const [errorTeam, teamErrors] of Object.entries(groupedErrors)) {
      errorsJson[errorTeam] = teamErrors.map((error) => {
        const statusMessage =
          HTTP_STATUS_MESSAGES[error.statusCode] || 'Unknown Error';

        const errorData: any = {
          endpoint: error.endpoint,
          method: error.method,
          statusCode: error.statusCode,
          statusMessage: statusMessage,
          timestamp: new Date(error.timestamp).toISOString(),
          username: error.username || 'unknown',
          correlationId: this.generateCorrelationId(),
          responsePayload: error.responsePayload || null,
        };

        // Add headers if present
        if (error.headers && Object.keys(error.headers).length > 0) {
          errorData.headers = error.headers;
        }

        return errorData;
      });
    }

    // Construct markdown format with team tags and JSON code block
    const text = `${teamTags}

\`\`\`json
${JSON.stringify(errorsJson, null, 2)}
\`\`\``;

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('[Sentinel UI] Failed to copy to clipboard:', err);
      // Fallback: create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Destroy the UI and clean up
   */
  destroy(): void {
    this.closeUI();

    const toggleContainer = document.getElementById('sentinel-ui-toggle-container');
    if (toggleContainer) {
      toggleContainer.remove();
    }
  }
}
