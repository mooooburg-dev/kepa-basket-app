# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native application built with Expo SDK 53 that provides a WebView-based interface for loading the @kepa-basket web application with native barcode scanning capabilities.

## Project Structure & Integration

This project works as a **mobile wrapper** for the @kepa-basket web application:

```
/Users/mooburg/Documents/Repositories/
├── kepa-basket-app/          # React Native mobile app (this project)
└── kepa-basket/              # Next.js web application (companion project)
```

### Integration Architecture

- **kepa-basket-app**: React Native app that provides native barcode scanning
- **@kepa-basket**: Next.js web application loaded in WebView
- **Communication**: `postMessage` API for bidirectional communication
- **Development**: Both projects can be modified independently

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

### Mobile App Components

- **App.tsx**: Main React Native component that handles:
  - WebView loading of @kepa-basket web application
  - Mode switching between 'web' and 'scan' modes
  - Barcode scanning with expo-camera
  - Message routing between WebView and native barcode scanner

- **BarcodeScanner.tsx**: Native barcode scanning component with:
  - Camera permission handling
  - Multiple barcode format support (EAN13, EAN8, UPC-A, Code128, etc.)
  - Flash/torch control
  - Scan validation and error handling
  - Visual feedback and guidance

- **components/BarcodeScanner.tsx**: Native barcode scanning component with camera integration

### Communication Protocol

The apps communicate via `postMessage` with structured JSON messages:

#### WebView → Native (Scan Request)
```javascript
// Simple string message
'scanBarcode'

// Or JSON message
{
  "type": "scanBarcode",
  "requestId": "req_123"
}
```

#### Native → WebView (Barcode Data)

**Barcode Scanned Response:**
```json
{
  "type": "barcode_scanned",
  "data": {
    "barcode": "8801234567890",
    "scanId": "scan_1704123456789",
    "timestamp": 1704123456789
  }
}
```

## Key Dependencies

- **expo**: Core Expo SDK for React Native development (v53)
- **expo-camera**: Native camera access and barcode scanning (v16.1.11)
- **react-native-webview**: WebView component for @kepa-basket integration (v13.13.5)
- **TypeScript**: Strict mode enabled for type safety

## Important Configuration

- **Node Version**: v22.17.1 (specified in .nvmrc)
- **TypeScript**: Extends Expo's base config with strict mode enabled
- **Expo Config**: Portrait orientation, New Architecture enabled, supports iOS/Android/Web
- **WebView Target**: Currently pointing to `http://192.168.123.104:3001` (adjust for local @kepa-basket server)

## API Integration

### Food Safety Korea API
- **API Integration**: Now handled by the @kepa-basket web application
- **Mobile App Role**: Only captures and transmits barcode data
- **Web App Role**: Receives barcode data and performs all API calls

## Development Workflow

### Working with Both Projects
```bash
# Terminal 1: Start @kepa-basket web server
cd ../kepa-basket
npm run dev          # Usually runs on port 3000

# Terminal 2: Start mobile app
cd ../kepa-basket-app  
npm start            # Expo development server
```

### Network Configuration
- Ensure both projects are on the same network
- Update WebView URL in `App.tsx` to match @kepa-basket server
- For physical devices, use actual IP address instead of localhost

## Development Notes

### Code Standards
- Maintain Korean language consistency in UI elements
- Follow existing TypeScript strict mode conventions
- Preserve WebView communication patterns
- Handle loading states and error conditions gracefully

### Communication Best Practices
- Keep mobile app focused on barcode scanning only
- Send simple, structured barcode data to web app
- Let web app handle all API integrations and error handling
- Track scan sessions with unique IDs for debugging

### Testing
- Test barcode scanning with various barcode formats
- Verify barcode data transmission to web app
- Test WebView communication in different network conditions
- Validate that web app receives and processes barcode data correctly