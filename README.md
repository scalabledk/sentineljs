# @scalable-labs/sentinel

[![CI](https://github.com/scalabledk/sentineljs/actions/workflows/ci.yml/badge.svg)](https://github.com/scalabledk/sentineljs/actions/workflows/ci.yml)
[![CodeQL](https://github.com/scalabledk/sentineljs/actions/workflows/codeql.yml/badge.svg)](https://github.com/scalabledk/sentineljs/actions/workflows/codeql.yml)
[![npm version](https://badge.fury.io/js/@scalable-labs%2Fsentinel.svg)](https://www.npmjs.com/package/@scalable-labs/sentinel)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dt/@scalable-labs/sentinel.svg)](https://www.npmjs.com/package/@scalable-labs/sentinel)

> **⚠️ Pre-1.0 Notice**: This package is currently in active development and has not reached v1.0 yet. APIs may change and stability is not guaranteed. Use in production at your own risk. We welcome feedback and contributions!

Frontend error monitoring client for Sentinel by Scalable Labs. Automatically captures and reports failed API requests with support for local storage, Microsoft Teams integration, and visual error tracking.

## 🔗 Related Projects

- **Backend Service**: [sentinel-server](https://github.com/scalabledk/sentinel-server)
- **Website**: [sentinel-website](https://github.com/scalabledk/sentinel-website)

> **Note**: This repository (`sentineljs`) contains the source code for the npm package published as `@scalable-labs/sentinel`.

## Installation

```bash
npm install @scalable-labs/sentinel
```

## Quick Start

### Local Mode with UI (No Backend Required)

Perfect for development or when you want to track errors locally without a backend:

```typescript
import { createSentinel } from '@scalable-labs/sentinel';

const sentinel = createSentinel({
  mode: 'local',  // Store errors in browser IndexedDB
  showUI: true,   // Show floating error viewer button
  uiPosition: 'bottom-right',
  teamMapping: {
    '/api/users': 'platform',
    '/api/orders': 'commerce',
    '/api/products': 'catalog',
  },
  teamsChannelUrl: 'https://teams.microsoft.com/l/channel/...',
  captureHeaders: ['x-correlation-id', 'x-request-id'],
  getUserName: () => getCurrentUser()?.email,
});

// Errors are automatically captured and stored locally
// Click the ⚠️ button to view, copy, or send to Teams
```

### Remote Mode (With Sentinel Backend)

```typescript
import { createSentinel } from '@scalable-labs/sentinel';

const sentinel = createSentinel({
  mode: 'remote',
  backendUrl: 'https://sentinel.yourcompany.com',
  apiKey: 'your-api-key',
  enabled: process.env.NODE_ENV === 'production',
  teamMapping: {
    '/api/users': 'platform',
    '/api/orders': 'commerce',
  },
  getUserName: () => getCurrentUser()?.username,
});

// Fetch interceptor is automatically installed!
// All failed requests will be batched and sent to backend
```

## Configuration

| Option             | Type                          | Required        | Default         | Description                                    |
| ------------------ | ----------------------------- | --------------- | --------------- | ---------------------------------------------- |
| `mode`             | `'local' \| 'remote'`         | No              | `'local'`       | Operating mode                                 |
| `teamMapping`      | `Record<string, string>`      | Yes             | -               | Map endpoints to teams                         |
| `enabled`          | `boolean`                     | No              | `true`          | Enable/disable reporting                       |
| `backendUrl`       | `string`                      | Yes (remote)    | -               | Sentinel backend URL (remote mode only)        |
| `apiKey`           | `string`                      | Yes (remote)    | -               | API key for backend (remote mode only)         |
| `showUI`           | `boolean`                     | No              | `false`         | Show visual error viewer (local mode only)     |
| `uiPosition`       | `'bottom-right' \| ...`       | No              | `'bottom-right'`| Position of UI button                          |
| `teamsChannelUrl`  | `string`                      | No              | -               | Microsoft Teams channel URL for notifications  |
| `captureHeaders`   | `string[]`                    | No              | -               | HTTP headers to capture from responses         |
| `getUserName`      | `() => string \| undefined`   | No              | `undefined`     | Function to get current username               |
| `batchSize`        | `number`                      | No              | `50`            | Batch size (remote mode)                       |
| `batchInterval`    | `number`                      | No              | `10000`         | Batch interval in ms (remote mode)             |
| `defaultTeam`      | `string`                      | No              | `'unknown'`     | Team for unmapped endpoints                    |
| `dbName`           | `string`                      | No              | `'sentinel'`    | IndexedDB database name (local mode)           |
| `maxLocalErrors`   | `number`                      | No              | `1000`          | Max errors to store locally                    |

## Features

### 🎯 Automatic Error Detection

Automatically captures failed HTTP requests (status >= 400) or network errors.

### 📦 Two Operating Modes

**Local Mode:**
- Stores errors in browser IndexedDB
- No backend required
- Perfect for development
- View errors in built-in UI
- Export as JSON
- Send to Microsoft Teams

**Remote Mode:**
- Sends errors to Sentinel backend
- Batched transmission
- Prometheus metrics
- Teams webhook alerts

### 🎨 Visual Error Viewer (Local Mode)

When `showUI: true`, a floating button (⚠️) appears to:
- View all tracked errors grouped by team
- Copy individual errors in JSON format
- Copy all errors in JSON format
- Send all errors to Microsoft Teams
- Clear all tracked errors
- Refresh error list

### 📊 Microsoft Teams Integration

Send errors directly to a Teams channel:

```typescript
teamsChannelUrl: 'https://teams.microsoft.com/l/channel/19%3a...thread.tacv2/General?groupId=...&tenantId=...'
```

Errors are formatted as JSON with team tags for easy tracking. All errors are sent to the configured channel.

### 📋 Header Capture

Capture specific headers from HTTP responses for distributed tracing:

```typescript
captureHeaders: ['x-correlation-id', 'x-request-id', 'x-trace-id']
```

Headers are included in error reports for debugging.

### 🏷️ Team Mapping

Map endpoints to teams using exact match, prefix matching, full URLs, or regex:

```typescript
teamMapping: {
  // Path-based matching
  '/api/users': 'platform',                              // Exact: /api/users
  '/api/users/': 'platform',                             // Prefix: /api/users/123, /api/users/456
  '/api/orders': 'commerce',                             // Prefix: /api/orders/...

  // Full URL matching
  'https://api.example.com/users': 'platform',           // Exact hostname match
  'https://api.example.[tld]/users': 'platform',         // TLD variation: matches .com, .dk, .co.uk, etc.
  'https://payments.stripe.[tld]/': 'payments',          // TLD variation with path prefix

  // Regex patterns
  '/^\\/api\\/products\\/\\d+$/': 'catalog',             // Regex: /api/products/123
  '/^\\/api\\/payments/': 'payments',                    // Regex: starts with /api/payments
}
```

**Matching Priority:**
1. **Exact match** - checked first
2. **Prefix/URL/Regex** - checked in order (first match wins)
3. **Default team** - if no match found

**Pattern Types:**

- **Path patterns**: String starting with `/` (but not ending with `/` for regex)
  - Exact: `/api/users` matches only `/api/users`
  - Prefix: `/api/users/` matches `/api/users/123`, `/api/users/456/profile`, etc.

- **Full URL patterns**: String starting with `http://` or `https://`
  - Exact hostname: `https://api.example.com/users` matches only `api.example.com`
  - TLD variation: `https://api.example.[tld]/users` matches:
    - `https://api.example.com/users`
    - `https://api.example.dk/users`
    - `https://api.example.co.uk/users`
  - Use `[tld]` placeholder in hostname to enable TLD variation
  - Path must match (prefix matching on path)

- **Regex patterns**: String starting and ending with `/`
  - Pattern between slashes is used as the regex
  - Example: `/^\\/api\\/v\\d+\\/users/` matches `/api/v1/users`, `/api/v2/users`, etc.
  - Invalid regex patterns are skipped with a warning

**Combined Example:**

```typescript
teamMapping: {
  // Path patterns
  '/api/users': 'platform',                              // Exact match
  '/api/users/': 'platform',                             // Prefix match

  // Full URL patterns (exact hostname)
  'https://api.internal.com/data': 'backend',            // Internal API
  'https://payment-gateway.company.com/': 'payments',    // Payment service

  // Full URL patterns (with TLD variation)
  'https://api.example.[tld]/products': 'catalog',       // Multi-region product API
  'https://cdn.assets.[tld]/images': 'media',            // Multi-region CDN

  // Regex patterns for paths
  '/^\\/api\\/orders\\/\\d+$/': 'commerce',              // /api/orders/123
  '/^\\/api\\/v[12]\\/users/': 'platform',               // /api/v1/users, /api/v2/users

  // Regex patterns for full URLs
  '/^https:\\/\\/.*\\.stripe\\.com\\/.*$/': 'payments',  // Any Stripe subdomain
  '/^https:\\/\\/[a-z0-9-]+\\.cloudfront\\.net\\/.*$/': 'cdn', // CloudFront URLs
}
```

**This configuration will match:**

*Path patterns:*
- `/api/users` → `platform` (exact)
- `/api/users/123` → `platform` (prefix)

*Full URL patterns (exact):*
- `https://api.internal.com/data` → `backend`
- `https://payment-gateway.company.com/checkout` → `payments`

*Full URL patterns (TLD variation):*
- `https://api.example.com/products` → `catalog`
- `https://api.example.dk/products` → `catalog`
- `https://api.example.co.uk/products/item` → `catalog`
- `https://cdn.assets.com/images/logo.png` → `media`
- `https://cdn.assets.fr/images/logo.png` → `media`

*Regex patterns (paths):*
- `/api/orders/456` → `commerce`
- `/api/v1/users` → `platform`
- `/api/v2/users/search` → `platform`

*Regex patterns (full URLs):*
- `https://payments.stripe.com/v1/charges` → `payments`
- `https://connect.stripe.com/oauth` → `payments`
- `https://d1234567890.cloudfront.net/assets/app.js` → `cdn`

### 👤 Optional User Tracking

Track which users experience errors:

```typescript
getUserName: () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).username : undefined;
}
```

### 🔐 Environment-based Toggling

Enable/disable based on environment:

```typescript
enabled: process.env.NODE_ENV === 'production'
// or
enabled: process.env.SENTINEL_ENABLED === 'true'
```

### 🛡️ Graceful Failure

If the Sentinel backend is unavailable, errors are logged to console but don't break your app.

## Advanced Usage

### Axios Integration

```typescript
import axios from 'axios';
import { SentinelClient, installAxiosInterceptor } from '@scalable-labs/sentinel';

const sentinel = new SentinelClient({
  mode: 'remote',
  backendUrl: 'https://sentinel.yourcompany.com',
  apiKey: 'your-api-key',
  teamMapping: { '/api/users': 'platform' },
});

installAxiosInterceptor(axios, sentinel);
```

### Manual Error Reporting

```typescript
import { SentinelClient } from '@scalable-labs/sentinel';

const sentinel = new SentinelClient({
  mode: 'local',
  teamMapping: { '/api/users': 'platform' },
});

// Manually report an error with headers
try {
  const response = await fetch('/api/users/123');
  if (!response.ok) {
    const payload = await response.text();
    const headers = {
      'x-correlation-id': response.headers.get('x-correlation-id') || '',
    };
    sentinel.reportError('/api/users/123', 'GET', response.status, payload, headers);
  }
} catch (error) {
  sentinel.reportError('/api/users/123', 'GET', 0, 'Network error');
}
```

### Export Local Errors

```typescript
const sentinel = createSentinel({ mode: 'local', teamMapping: {...} });

// Get all errors as array
const errors = await sentinel.getLocalErrors();

// Export as JSON string
const json = await sentinel.exportLocalErrors();
console.log(json);

// Clear all errors
await sentinel.clearLocalErrors();
```

### Manual Flush (Remote Mode)

Force send all queued errors immediately:

```typescript
window.addEventListener('beforeunload', () => {
  sentinel.flush();
});
```

## Examples

### React App with Local Mode

```typescript
// src/sentinel.ts
import { createSentinel } from '@scalable-labs/sentinel';

export const sentinel = createSentinel({
  mode: 'local',
  showUI: true,
  uiPosition: 'bottom-right',
  teamMapping: {
    '/api/auth': 'platform',
    '/api/users': 'platform',
    '/api/products': 'catalog',
  },
  teamsChannelUrl: 'https://teams.microsoft.com/l/channel/...',
  captureHeaders: ['x-correlation-id', 'x-request-id'],
  getUserName: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr).email : undefined;
  },
});

// src/main.tsx
import { sentinel } from './sentinel';
// Sentinel is now monitoring all fetch requests!
```

### Next.js App with Remote Mode

```typescript
// lib/sentinel.ts
import { createSentinel } from '@scalable-labs/sentinel';

export const sentinel = createSentinel({
  mode: 'remote',
  backendUrl: process.env.NEXT_PUBLIC_SENTINEL_URL!,
  apiKey: process.env.NEXT_PUBLIC_SENTINEL_API_KEY!,
  enabled: process.env.NODE_ENV === 'production',
  teamMapping: {
    '/api/auth': 'platform',
    '/api/blog': 'content',
    '/api/products': 'ecommerce',
  },
  captureHeaders: ['x-trace-id'],
  getUserName: () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('username') || undefined;
    }
  },
});

// app/layout.tsx or pages/_app.tsx
import { sentinel } from '@/lib/sentinel';
// Auto-monitoring enabled!
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

## Publishing

This package is published to npm as `@scalable-labs/sentinel`.

```bash
npm publish --access public
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/scalabledk/sentineljs).
