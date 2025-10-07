# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.1] - 2025-10-07

### Fixed
- **Legacy Import Path**: Fixed module resolution for `@scalable-labs/sentinel/legacy` import
  - Added `legacy/package.json` to properly resolve CommonJS module
  - Now works with `require('@scalable-labs/sentinel/legacy')` without needing full path
  - Compatible with older module resolution systems (Webpack 4, older Node.js)

## [0.5.0] - 2025-10-07

### Changed
- **In-Memory Storage for Local Mode**: Replaced IndexedDB with in-memory storage
  - Errors are now stored in memory only (no database)
  - Fresh session on every page load - perfect for development and debugging
  - No initialization delays or database setup
  - Faster performance

### Added
- **Error Deduplication**: Prevent duplicate error reports from frontend retries
  - New `deduplicationWindow` configuration option (default: 60 seconds)
  - Deduplication key: `endpoint:method:statusCode:team`
  - Automatically prevents the same error from being reported multiple times within the window
  - Works for both local and remote modes
  - Automatic cleanup of old cache entries

### Removed
- IndexedDB dependency for local mode (still exported for backward compatibility)
- `dbName` configuration is now unused but kept for backward compatibility

## [0.4.0] - 2025-10-07

### Changed
- **Simplified Teams Integration**: Removed deep link construction in favor of simple button
  - Added `teamsButtonLabel` configuration option (default: "Send to Teams")
  - Button now simply opens the configured Teams channel URL in a new tab
  - Allows custom button text like "Visit our Teams channel" or "Report to Support"
  - Removed complex deep link construction that was not supported by Microsoft Teams

### Fixed
- Teams button now works reliably without depending on unsupported deep link features

## [0.3.0] - 2025-10-07

### Added
- **Selective Error Capture**: Only capture errors for endpoints defined in team mappings
  - Unmapped endpoints are now ignored, preventing noise from unknown API calls
  - Errors are only tracked when endpoint matches a team mapping pattern

### Changed
- **Conditional UI Visibility**: Error viewer UI now only appears when errors are present
  - UI button hidden by default on initialization
  - UI button automatically shown when first error is captured
  - UI button hidden when all errors are cleared
  - On page reload, button shows only if stored errors exist

## [0.2.2] - 2025-10-07

### Fixed
- **Legacy Build File Extensions**: Fixed file naming and extensions for proper CommonJS module resolution
  - Changed output files from `sentinel.cjs.js` to `index.cjs` (proper CommonJS extension)
  - Changed UMD output from `sentinel.umd.js` to `index.umd.js`
  - Changed TypeScript declarations from `sentinel.d.ts` to `index.d.ts`
  - Added `exports: 'named'` to CommonJS output configuration
  - Now works correctly with `require('@scalable-labs/sentinel/legacy')` in Webpack 4 and older bundlers

## [0.2.1] - 2025-10-07

### Fixed
- **Package Exports**: Fixed TypeScript module resolution for `/legacy` export
  - Added `types` field first in export conditions for better TypeScript compatibility
  - Added `default` export fallback for bundlers
  - Removed `import` condition from legacy export (CommonJS only)
  - Now works correctly with `moduleResolution: "node"`, `"node16"`, `"nodenext"`, and `"bundler"`

## [0.2.0] - 2025-10-06

### Added
- **Legacy Build Support**: ES5-compatible build for Webpack 4 and older bundlers
  - New entry point: `@scalable-labs/sentinel/legacy`
  - Includes polyfills for `String.prototype.startsWith`, `includes`, `Object.assign`, `Object.entries`
  - UMD and CommonJS formats for broader compatibility
  - Full TypeScript definitions included
  - Compatible with IE11+ (with Promise polyfill)
- **Rollup Build Pipeline**: Modern build system for generating legacy builds
- **Comprehensive Legacy Documentation**: Added `LEGACY.md` with usage examples and migration guide

### Changed
- Build process now generates both modern (ES2020) and legacy (ES5) bundles
- Package exports now include both modern and legacy entry points

## [0.1.1] - 2025-10-06

### Fixed
- Linter errors that were preventing CI from passing
- ESLint configuration to properly handle underscore-prefixed unused variables
- Unused variable errors in `sentinel.ts` and `indexeddb.ts`

### Added
- Lefthook pre-commit hooks for automated code quality checks
- Pre-push build verification to prevent broken commits

### Changed
- Updated `eslint-config-prettier` to latest version (10.1.8)

## [0.1.0] - 2025-10-06

**⚠️ Note**: This release had linter errors that prevented CI from passing. Use v0.1.1 instead.

**⚠️ Pre-release**: This is an initial pre-1.0 release. APIs may change and stability is not guaranteed.

### Added
- **Local Mode**: Store errors in browser IndexedDB without requiring a backend server
- **Visual Error Viewer UI**: Built-in floating button to view, manage, and export errors
- **Microsoft Teams Integration**: Send errors directly to a Teams channel with deep linking
- **Header Capture**: Configure which HTTP response headers to capture for distributed tracing
- **Advanced Team Mapping**:
  - Regex patterns for flexible endpoint matching
  - Full URL patterns with optional TLD variation support (use `[tld]` placeholder in hostname)
- **Two Operating Modes**:
  - `local`: Store errors in browser with optional UI
  - `remote`: Send errors to Sentinel backend server
- **Error Management**:
  - View errors grouped by team
  - Copy individual errors in JSON format with markdown code blocks
  - Copy all errors in JSON format with team tags
  - Send all errors to Teams channels (opens multiple tabs for multiple teams)
  - Clear all tracked errors
  - Refresh error list
- **UI Features**:
  - Configurable position (bottom-right, bottom-left, top-right, top-left)
  - Floating action button with pulsing animation
  - Modal error viewer with team grouping
  - Responsive design with inline styles (zero dependencies)
  - React StrictMode compatible
- **IndexedDB Storage**:
  - Automatic storage management with configurable max errors (default: 1000)
  - Oldest-first eviction when limit reached
  - Export capabilities for manual analysis
- **Enhanced Error Format**:
  - Team tags for easy team mentions
  - JSON code blocks for machine readability
  - Auto-generated correlation IDs for error tracking
  - HTTP status messages included
  - Captured headers included when configured
- **Fetch Interceptor**: Automatic installation with `createSentinel()`
- **Axios Interceptor**: Manual installation with `installAxiosInterceptor()`
- **TypeScript Support**: Full type definitions with declaration maps
- **Graceful Degradation**: Errors in reporting never break the application

### Configuration Options
- `mode`: Operating mode (`'local'` or `'remote'`)
- `showUI`: Enable/disable visual error viewer (local mode only)
- `uiPosition`: Position of UI button
- `teamsChannelUrl`: Single Teams channel URL for all errors
- `captureHeaders`: Array of header names to capture from responses
- `teamMapping`: Supports exact match, prefix match, regex patterns (wrap in `/pattern/`), and full URLs with `[tld]` placeholder for TLD variation
- `dbName`: IndexedDB database name (default: 'sentinel')
- `maxLocalErrors`: Maximum errors to store locally (default: 1000)

### Documentation
- Comprehensive README with examples for React, Next.js, and Vue
- MIT License included
- Package configured for npm publishing as `@scalable-labs/sentinel`

[0.5.1]: https://github.com/scalabledk/sentineljs/releases/tag/v0.5.1
[0.5.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.5.0
[0.4.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.4.0
[0.3.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.3.0
[0.2.2]: https://github.com/scalabledk/sentineljs/releases/tag/v0.2.2
[0.2.1]: https://github.com/scalabledk/sentineljs/releases/tag/v0.2.1
[0.2.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.2.0
[0.1.1]: https://github.com/scalabledk/sentineljs/releases/tag/v0.1.1
[0.1.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.1.0
