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
  - Food Safety Korea API integration (I2570 + C005)
  - Message routing between WebView and native features

- **BarcodeScanner.tsx**: Native barcode scanning component with:
  - Camera permission handling
  - Multiple barcode format support (EAN13, EAN8, UPC-A, Code128, etc.)
  - Flash/torch control
  - Scan validation and error handling
  - Visual feedback and guidance

- **services/foodSafetyApi.ts**: API integration for food safety data:
  - Dual API support (I2570: 축산물이력제, C005: 식품등록정보)
  - Parallel API calls for better coverage
  - Comprehensive error handling and logging
  - Configurable API keys

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

#### Native → WebView (Scan Results)

**Success Response:**
```json
{
  "type": "barcode_success",
  "success": true,
  "data": {
    "barcode": "8801234567890",
    "productInfo": {
      "productName": "Product Name",
      "company": "Company Name", 
      "country": "Country",
      "category": "Category",
      "source": "I2570",
      "sourceLabel": "축산물이력제"
    },
    "debug": {
      "scanId": "scan_1704123456789",
      "scanTime": "2024-01-01T12:34:56.789Z",
      "apiDuration": 1250,
      "usingSampleData": false,
      "foundIn": "I2570",
      "searchResult": "found"
    }
  }
}
```

**Not Found Response:**
```json
{
  "type": "barcode_not_found",
  "success": false,
  "data": {
    "barcode": "1234567890123",
    "error": "해당 바코드로 등록된 제품을 찾을 수 없습니다",
    "debug": {
      "scanId": "scan_1704123456790",
      "searchedAPIs": ["I2570", "C005"],
      "searchResult": "not_found"
    }
  }
}
```

**Error Response:**
```json
{
  "type": "barcode_error",
  "success": false,
  "data": {
    "barcode": "8801234567890",
    "error": "API 요청 시간이 초과되었습니다",
    "debug": {
      "scanId": "scan_1704123456791",
      "errorCode": "TIMEOUT_ERROR",
      "errorDetails": "API request timeout",
      "totalDuration": 10500,
      "searchResult": "error"
    }
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
- **API Configuration**: Food Safety Korea API keys in `config/api.ts`
- **WebView Target**: Currently pointing to `http://192.168.123.104:3000` (adjust for local @kepa-basket server)

## API Integration

### Food Safety Korea API
- **I2570 API**: 축산물이력제 (Livestock traceability)
- **C005 API**: 식품등록정보 (Food registration info)
- **Configuration**: Set `FOOD_SAFETY_API_KEY` in `.env` or `config/api.ts`
- **Sample Key**: `f5f2c3dc00b14704909a` (included for testing)

### API Response Priority
1. I2570 API results (preferred)
2. C005 API results (fallback)
3. "Not found" if both APIs return no results

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
- Always include debug information in postMessage responses
- Use structured JSON messages for complex data
- Implement proper error handling for API failures
- Track scan sessions with unique IDs for debugging

### Testing
- Test barcode scanning with various barcode formats
- Verify API responses for both successful and failed lookups
- Test WebView communication in different network conditions
- Validate error handling for API timeouts and failures