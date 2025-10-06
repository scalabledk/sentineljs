/**
 * Legacy entry point for Webpack 4 and older bundlers
 * Includes ES5 polyfills for broader compatibility
 */

// Import polyfills first
import './polyfills';

// Re-export everything from main index
export * from './index';
