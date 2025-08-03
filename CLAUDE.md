# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application built with Expo SDK 53 that provides a WebView-based interface for loading external web pages with native mode switching capabilities.

## Development Commands

```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run on web
npm run web
```

## Architecture

The application follows a simple single-component architecture:

- **App.tsx**: Main component that handles:
  - WebView loading of `http://192.168.123.111:3003`
  - Mode switching between 'web' and 'scan' modes via JavaScript message handling
  - Korean language UI elements
  - Placeholder for future barcode scanner integration

- **Communication Pattern**: The WebView sends messages to the native app using `postMessage`. When receiving 'scanBarcode', the app switches to scan mode.

## Key Dependencies

- **expo**: Core Expo SDK for React Native development
- **react-native-webview**: WebView component for displaying external web content
- **TypeScript**: Strict mode enabled for type safety

## Important Configuration

- **Node Version**: v22.17.1 (specified in .nvmrc)
- **TypeScript**: Extends Expo's base config with strict mode enabled
- **Expo Config**: Portrait orientation, New Architecture enabled, supports iOS/Android/Web

## Development Notes

Currently missing standard development tools:
- No linting setup (ESLint)
- No formatting setup (Prettier)  
- No testing framework
- No git hooks or CI/CD

When implementing new features:
- Maintain the existing mode switching pattern
- Preserve WebView message handling functionality
- Keep Korean language consistency in UI elements
- Consider WebView loading states and error handling