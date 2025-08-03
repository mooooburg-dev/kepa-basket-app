# Kepa Basket App

React Native와 Expo를 활용한 웹뷰 기반 바스켓 관리 애플리케이션입니다.

## 주요 기능

- WebView를 통한 외부 웹페이지 로드
- 웹/스캔 모드 전환
- 웹페이지와 네이티브 앱 간 메시지 통신
- 바코드 스캐너 연동 (예정)

## 기술 스택

- React Native
- Expo
- TypeScript
- React Native WebView

## 필수 요구사항

- Node.js 14.0 이상
- Expo CLI
- iOS/Android 개발 환경 (선택사항)

## 설치

```bash
npm install
```

## 실행

```bash
# Expo 개발 서버 시작
npm start

# Android에서 실행
npm run android

# iOS에서 실행
npm run ios

# 웹에서 실행
npm run web
```

## 프로젝트 구조

```
kepa-basket-app/
├── App.tsx            # 메인 애플리케이션 컴포넌트
├── index.ts           # 엔트리 포인트
├── package.json       # 프로젝트 설정
├── tsconfig.json      # TypeScript 설정
└── babel.config.js    # Babel 설정
```

## 주요 컴포넌트

### App.tsx

- WebView를 통해 `http://192.168.123.111:3003` 로드
- 웹페이지에서 'scanBarcode' 메시지 수신 시 스캔 모드로 전환
- 스캔 모드에서는 바코드 스캐너 화면 표시 (구현 예정)
