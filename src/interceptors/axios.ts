import { SentinelClient } from '../sentinel';

/**
 * Install an axios interceptor that reports errors to Sentinel
 *
 * @param axiosInstance - The axios instance to intercept
 * @param sentinel - The Sentinel client
 */
export function installAxiosInterceptor(axiosInstance: any, sentinel: SentinelClient): void {
  if (!axiosInstance || !axiosInstance.interceptors) {
    console.warn('[Sentinel] Invalid axios instance provided');
    return;
  }

  // Response interceptor
  axiosInstance.interceptors.response.use(
    (response: any) => {
      // Check if response has error status
      if (response.status >= 400) {
        const endpoint = extractEndpoint(response.config.url, response.config.baseURL);
        const method = (response.config.method || 'GET').toUpperCase();

        let responsePayload: string | undefined;
        if (response.data) {
          const payload = typeof response.data === 'string'
            ? response.data
            : JSON.stringify(response.data);
          responsePayload = payload.length > 1000
            ? payload.substring(0, 1000) + '...'
            : payload;
        }

        sentinel.reportError(endpoint, method, response.status, responsePayload);
      }

      return response;
    },
    (error: any) => {
      // Error response (4xx, 5xx) or network error
      if (error.response) {
        // Server responded with error status
        const endpoint = extractEndpoint(error.config?.url, error.config?.baseURL);
        const method = (error.config?.method || 'GET').toUpperCase();

        let responsePayload: string | undefined;
        if (error.response.data) {
          const payload = typeof error.response.data === 'string'
            ? error.response.data
            : JSON.stringify(error.response.data);
          responsePayload = payload.length > 1000
            ? payload.substring(0, 1000) + '...'
            : payload;
        }

        sentinel.reportError(endpoint, method, error.response.status, responsePayload);
      } else if (error.request) {
        // Request made but no response (network error)
        const endpoint = extractEndpoint(error.config?.url, error.config?.baseURL);
        const method = (error.config?.method || 'GET').toUpperCase();

        sentinel.reportError(endpoint, method, 0, error.message || 'Network error');
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Extract endpoint path from URL
 */
function extractEndpoint(url?: string, baseURL?: string): string {
  if (!url) return '/unknown';

  try {
    // If URL is absolute
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url);
      return urlObj.pathname;
    }

    // If URL is relative and we have a baseURL
    if (baseURL) {
      const urlObj = new URL(url, baseURL);
      return urlObj.pathname;
    }

    // Return as-is if it's just a path
    return url;
  } catch {
    return url;
  }
}
