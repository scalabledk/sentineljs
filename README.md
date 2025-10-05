# @scalable-labs/sentineljs

Frontend error monitoring client for Sentinel by Scalable Labs. Automatically captures and reports failed API requests to your Sentinel backend.

## 🔗 Related Projects

- **Backend Service**: [sentinel-server](https://github.com/scalabledk/sentinel-server)
- **Website**: [sentinel-website](https://github.com/scalabledk/sentinel-website)

> **Note**: This repository (`sentineljs`) contains the source code for the npm package published as `@scalable-labs/sentineljs`.

## Installation

```bash
npm install @scalable-labs/sentineljs
```

## Quick Start

### Basic Setup (Auto Fetch Interceptor)

```typescript
import { createSentinel } from "@scalable-labs/sentineljs";

const sentinel = createSentinel({
  backendUrl: "http://localhost:3000",
  enabled: process.env.NODE_ENV === "production",
  teamMapping: {
    "/api/users": "platform",
    "/api/orders": "commerce",
    "/api/products": "catalog",
  },
  getUserName: () => {
    // Return current user if authenticated
    const user = getCurrentUser();
    return user?.username;
  },
});

// Fetch interceptor is automatically installed!
// All failed requests will now be reported
```

### Axios Integration

```typescript
import axios from "axios";
import { SentinelClient, installAxiosInterceptor } from "@scalable-labs/sentineljs";

const sentinel = new SentinelClient({
  backendUrl: "http://localhost:3000",
  enabled: true,
  teamMapping: {
    "/api/users": "platform",
    "/api/orders": "commerce",
  },
});

// Install axios interceptor
installAxiosInterceptor(axios, sentinel);

// Now all axios requests will be monitored
axios.get("/api/users/123").catch((err) => {
  // Error is automatically reported to Sentinel
  console.error(err);
});
```

### Manual Error Reporting

```typescript
import { SentinelClient } from "@scalable-labs/sentineljs";

const sentinel = new SentinelClient({
  backendUrl: "http://localhost:3000",
  enabled: true,
  teamMapping: { "/api/users": "platform" },
});

// Manually report an error
try {
  const response = await fetch("/api/users/123");
  if (!response.ok) {
    const payload = await response.text();
    sentinel.reportError("/api/users/123", "GET", response.status, payload);
  }
} catch (error) {
  sentinel.reportError("/api/users/123", "GET", 0, "Network error");
}
```

## Configuration

| Option          | Type                        | Required | Default     | Description                                 |
| --------------- | --------------------------- | -------- | ----------- | ------------------------------------------- |
| `backendUrl`    | `string`                    | Yes      | -           | Sentinel backend URL                        |
| `teamMapping`   | `Record<string, string>`    | Yes      | -           | Map endpoints to teams                      |
| `enabled`       | `boolean`                   | Yes      | -           | Enable/disable reporting                    |
| `getUserName`   | `() => string \| undefined` | No       | `undefined` | Function to get current username            |
| `batchSize`     | `number`                    | No       | `50`        | Send batch when this many errors accumulate |
| `batchInterval` | `number`                    | No       | `10000`     | Send batch after this many ms (10s)         |
| `defaultTeam`   | `string`                    | No       | `'unknown'` | Team for unmapped endpoints                 |

## Features

### 🎯 Automatic Error Detection

Automatically captures failed HTTP requests (status >= 400) or network errors.

### 📦 Batching

Errors are batched to reduce network overhead. Sends when:

- Batch size is reached (default: 50 errors)
- Batch interval expires (default: 10 seconds)

### 🏷️ Team Mapping

Map endpoints to teams using exact match or prefix matching:

```typescript
teamMapping: {
  '/api/users': 'platform',      // Exact: /api/users
  '/api/users/': 'platform',     // Prefix: /api/users/123, /api/users/456
  '/api/orders': 'commerce',
}
```

Unmapped endpoints default to `'unknown'` team.

### 👤 Optional User Tracking

Track which users experience errors:

```typescript
getUserName: () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user).username : undefined;
};
```

### 🔐 Environment-based Toggling

Enable/disable based on environment:

```typescript
enabled: process.env.NODE_ENV === "production";
// or
enabled: process.env.SENTINEL_ENABLED === "true";
```

### 🛡️ Graceful Failure

If the Sentinel backend is unavailable, errors are logged to console but don't break your app.

## Examples

### React App

```typescript
// src/sentinel.ts
import { createSentinel } from "@scalable-labs/sentineljs";

export const sentinel = createSentinel({
  backendUrl: import.meta.env.VITE_SENTINEL_URL,
  enabled: import.meta.env.PROD,
  teamMapping: {
    "/api/auth": "platform",
    "/api/users": "platform",
    "/api/products": "catalog",
    "/api/orders": "commerce",
  },
  getUserName: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email;
    }
  },
  batchSize: 20,
  batchInterval: 5000,
});

// src/main.tsx
import { sentinel } from "./sentinel";
// Sentinel is now monitoring all fetch requests!
```

### Vue App

```typescript
// plugins/sentinel.ts
import { SentinelClient, installAxiosInterceptor } from "@scalable-labs/sentineljs";
import axios from "axios";

const sentinel = new SentinelClient({
  backendUrl: import.meta.env.VITE_SENTINEL_URL,
  enabled: import.meta.env.PROD,
  teamMapping: {
    "/api/auth": "auth-team",
    "/api/dashboard": "dashboard-team",
  },
  getUserName: () => {
    // Access Pinia store or vuex
    const authStore = useAuthStore();
    return authStore.user?.username;
  },
});

// Install on your axios instance
installAxiosInterceptor(axios, sentinel);

export default sentinel;
```

### Next.js App

```typescript
// lib/sentinel.ts
import { createSentinel } from "@scalable-labs/sentineljs";

export const sentinel = createSentinel({
  backendUrl: process.env.NEXT_PUBLIC_SENTINEL_URL!,
  enabled: process.env.NODE_ENV === "production",
  teamMapping: {
    "/api/auth": "platform",
    "/api/blog": "content",
    "/api/products": "ecommerce",
  },
  getUserName: () => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("username") || undefined;
    }
  },
});

// app/layout.tsx or pages/_app.tsx
import { sentinel } from "@/lib/sentinel";
// Auto-monitoring enabled!
```

## Manual Flush

Force send all queued errors immediately:

```typescript
// Before user navigates away
window.addEventListener("beforeunload", () => {
  sentinel.flush();
});
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
```

## Publishing

This package is published to npm as `@scalable-labs/sentineljs`.

```bash
npm publish --access public
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on [GitHub](https://github.com/scalabledk/sentinel-js).
