# Legacy Build for Webpack 4 and Older Bundlers

The Sentinel library provides a legacy build specifically designed for compatibility with older build tools like Webpack 4, which have limited support for modern JavaScript features.

## What's Different in the Legacy Build?

The legacy build:
- **Transpiled to ES5** - Compatible with older browsers (IE11+)
- **Includes polyfills** - Provides ES2015+ features like `String.prototype.startsWith`, `Object.assign`, `Object.entries`
- **UMD and CommonJS formats** - Works with older module systems
- **Fully bundled** - All dependencies included, no external imports

## Installation

Install the package normally:

```bash
npm install @scalable-labs/sentinel
```

## Usage with Webpack 4

### Option 1: Import the Legacy Entry Point

```javascript
// Use the legacy build
import { createSentinel } from '@scalable-labs/sentinel/legacy';

const sentinel = createSentinel({
  mode: 'local',
  teamMapping: {
    '/api/users': 'platform',
    '/api/products': 'commerce',
  },
  showUI: true,
});
```

### Option 2: Use Direct Script Tag

If you're not using a module bundler, include the UMD build directly:

```html
<script src="node_modules/@scalable-labs/sentinel/dist/legacy/sentinel.umd.js"></script>
<script>
  var sentinel = Sentinel.createSentinel({
    mode: 'local',
    teamMapping: {
      '/api/users': 'platform',
    },
  });
</script>
```

### Option 3: Webpack Configuration

Add this to your `webpack.config.js` to always use the legacy build:

```javascript
module.exports = {
  // ... other config
  resolve: {
    alias: {
      '@scalable-labs/sentinel': '@scalable-labs/sentinel/legacy',
    },
  },
};
```

## Browser Compatibility

The legacy build supports:
- ✅ IE11+ (with Promise polyfill)
- ✅ Chrome 23+
- ✅ Firefox 21+
- ✅ Safari 6+
- ✅ Edge (all versions)

**Note**: For IE11, you'll need to include a Promise polyfill since IndexedDB operations use Promises:

```html
<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"></script>
```

Or via npm:

```bash
npm install promise-polyfill
```

```javascript
import 'promise-polyfill/src/polyfill';
import { createSentinel } from '@scalable-labs/sentinel/legacy';
```

## What's Polyfilled?

The legacy build includes polyfills for:
- `String.prototype.startsWith`
- `String.prototype.includes`
- `Object.assign`
- `Object.entries`

## Bundle Size

The legacy build is larger due to polyfills and ES5 transpilation:

- **Modern build**: ~33KB (minified)
- **Legacy build**: ~33KB (minified, includes polyfills)
- **Legacy build (gzipped)**: ~9KB

## TypeScript Support

The legacy build includes full TypeScript definitions:

```typescript
import { createSentinel, SentinelClient, SentinelConfig } from '@scalable-labs/sentinel/legacy';

const sentinel: SentinelClient = createSentinel({
  mode: 'local',
  teamMapping: {
    '/api/*': 'backend-team',
  },
});
```

## Webpack 4 Common Issues

### Issue: "Module parse failed: Unexpected token"

**Solution**: Use the legacy build import:
```javascript
import { createSentinel } from '@scalable-labs/sentinel/legacy';
```

### Issue: "Can't resolve 'core-js'"

**Solution**: The legacy build includes all polyfills internally. Make sure you're importing from `/legacy`.

### Issue: "require is not defined" (in browser)

**Solution**: Ensure your Webpack config has proper target:
```javascript
module.exports = {
  target: 'web',
  // ...
};
```

## Building from Source

If you want to build the legacy version from source:

```bash
cd sentinel-js
npm install
npm run build:legacy
```

Output will be in `dist/legacy/`:
- `sentinel.umd.js` - UMD format for browsers
- `sentinel.cjs.js` - CommonJS format for Node.js/bundlers
- `sentinel.d.ts` - TypeScript definitions

## Differences from Modern Build

| Feature | Modern Build | Legacy Build |
|---------|-------------|--------------|
| Module format | ESNext | UMD/CJS |
| Target | ES2020 | ES5 |
| Polyfills | None | Included |
| Size | Smaller | Slightly larger |
| Browser support | Modern browsers | IE11+ |
| Recommended for | Webpack 5+, Vite, Rollup | Webpack 4, older tools |

## Migration Path

When you upgrade your build tools, you can switch back to the modern build:

```diff
- import { createSentinel } from '@scalable-labs/sentinel/legacy';
+ import { createSentinel } from '@scalable-labs/sentinel';
```

No other code changes are required - the API is identical.

## Support

For issues specific to the legacy build, please open an issue at:
https://github.com/scalabledk/sentineljs/issues
