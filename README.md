# Kepa Basket App

React Native와 Expo를 활용한 웹뷰 기반 바코드 스캔 애플리케이션입니다. Next.js 웹앱과 연동하여 모바일에서 바코드 스캔 후 가격 비교 서비스를 제공합니다.

## 주요 기능

- WebView를 통한 Next.js 웹페이지 로드
- 실시간 바코드 스캐너
- 웹앱과 양방향 메시지 통신
- 카메라 권한 관리

## 기술 스택

- React Native
- Expo SDK 53
- TypeScript
- React Native WebView
- Expo Camera
- Expo Barcode Scanner

## 필수 요구사항

- Node.js v22.17.1 (`.nvmrc` 참조)
- Expo CLI
- iOS/Android 개발 환경 (선택사항)
- 카메라 권한 (바코드 스캔용)

## 설치

```bash
npm install
```

## 실행

### 1. Next.js 웹앱 실행 (병렬 실행 필요)

```bash
# 먼저 kepa-basket 폴더로 이동
cd ../kepa-basket

# 개발 서버 시작 (모든 네트워크에서 접근 가능)
npm run dev
```

### 2. React Native 앱 실행

```bash
# Expo 개발 서버 시작
npm start

# Android에서 실행
npm run android

# iOS에서 실행
npm run ios
```

## 프로젝트 구조

```
kepa-basket-app/
├── App.tsx                     # 메인 애플리케이션 컴포넌트
├── components/
│   └── BarcodeScanner.tsx      # 바코드 스캐너 컴포넌트
├── index.ts                    # 엔트리 포인트
├── package.json                # 프로젝트 설정
├── tsconfig.json               # TypeScript 설정
└── babel.config.js             # Babel 설정
```

## 주요 컴포넌트

### App.tsx

- WebView를 통해 `http://192.168.123.107:3000` 로드
- 웹페이지에서 'scanBarcode' 메시지 수신 시 스캔 모드로 전환
- 바코드 스캔 결과를 WebView로 전송

### BarcodeScanner.tsx

- 카메라 권한 요청 및 관리
- 실시간 바코드 스캔 기능
- 다양한 바코드 포맷 지원 (EAN13, UPC, Code128 등)

## 통신 프로토콜

### Web → Native
- 메시지: `'scanBarcode'`
- 바코드 스캔 모드 진입 요청

### Native → Web
```json
{
  "type": "barcode",
  "barcode": "8801234567890"
}
```

## 테스트 방법

1. Next.js 웹앱을 실행하고 `http://192.168.123.107:3000`에서 접근 가능한지 확인
2. React Native 앱에서 WebView가 정상 로드되는지 확인
3. "바코드 스캔하여 가격 비교" 버튼 클릭하여 카메라 화면 진입 확인
4. 실제 바코드를 스캔하여 웹앱에 결과가 전달되는지 테스트

## 문제 해결

### WebView 연결 안됨
- IP 주소가 정확한지 확인 (`ifconfig` 명령어로 확인)
- 방화벽 설정 확인
- 같은 네트워크에 연결되어 있는지 확인

### 카메라 권한 오류
- 앱 설정에서 카메라 권한이 허용되어 있는지 확인
- iOS: Settings > Privacy & Security > Camera
- Android: Settings > Apps > [App Name] > Permissions
