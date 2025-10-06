# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2025-10-06

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

[0.1.0]: https://github.com/scalabledk/sentineljs/releases/tag/v0.1.0
