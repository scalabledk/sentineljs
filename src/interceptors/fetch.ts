import { SentinelClient } from '../sentinel';

/**
 * Install a fetch interceptor that reports errors to Sentinel
 */
export function installFetchInterceptor(sentinel: SentinelClient): void {
  if (typeof window === 'undefined' || !window.fetch) {
    return; // Not in browser or fetch not available
  }

  const originalFetch = window.fetch;

  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const [input, init] = args;

    try {
      const response = await originalFetch.apply(this, args);

      // Report errors (4xx and 5xx)
      if (response.status >= 400) {
        const url =
          typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
        const method = init?.method || 'GET';

        // Try to get response payload
        let responsePayload: string | undefined;
        try {
          const clone = response.clone();
          responsePayload = await clone.text();
          // Limit payload size
          if (responsePayload.length > 1000) {
            responsePayload = responsePayload.substring(0, 1000) + '...';
          }
        } catch {
          // Ignore if we can't read the body
        }

        // Capture configured headers
        const captureHeaders = sentinel.getCaptureHeaders();
        let headers: Record<string, string> | undefined;
        if (captureHeaders && captureHeaders.length > 0) {
          headers = {};
          captureHeaders.forEach((headerName) => {
            const headerValue = response.headers.get(headerName);
            if (headerValue) {
              headers![headerName] = headerValue;
            }
          });
        }

        // Extract endpoint path (remove origin)
        const endpoint = extractEndpoint(url);

        sentinel.reportError(endpoint, method, response.status, responsePayload, headers);
      }

      return response;
    } catch (error) {
      // Network error or other fetch failure
      const url =
        typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      const method = init?.method || 'GET';
      const endpoint = extractEndpoint(url);

      // Report as 0 status code (network error)
      sentinel.reportError(
        endpoint,
        method,
        0,
        error instanceof Error ? error.message : 'Network error',
      );

      throw error;
    }
  };
}

/**
 * Extract endpoint path from URL
 */
function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.pathname;
  } catch {
    return url;
  }
}
