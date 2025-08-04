// Food Safety Korea API 설정
export const API_CONFIG = {
  // 실제 API 키를 여기에 입력하세요
  // 식품안전나라 Open API에서 발급받은 인증키
  FOOD_SAFETY_API_KEY: process.env.FOOD_SAFETY_API_KEY || 'f5f2c3dc00b14704909a',
  
  // API 기본 설정
  BASE_URL: 'http://openapi.foodsafetykorea.go.kr/api',
  TIMEOUT: 10000, // 10초
  MAX_RESULTS: 100
};

// API 키가 샘플인지 확인하는 유틸리티 함수
export function isUsingSampleData(): boolean {
  return API_CONFIG.FOOD_SAFETY_API_KEY === 'f5f2c3dc00b14704909a' || API_CONFIG.FOOD_SAFETY_API_KEY === 'sample';
}

// 실제 API 키 설정 가이드
export const API_SETUP_GUIDE = {
  title: '실제 데이터 사용을 위한 API 키 설정',
  steps: [
    '1. 식품안전나라 Open API 홈페이지 방문 (https://www.foodsafetykorea.go.kr/api/openApiInfo.do)',
    '2. 회원가입 후 API 인증키 신청',
    '3. 발급받은 인증키를 config/api.ts 파일의 FOOD_SAFETY_API_KEY에 설정',
    '4. 또는 환경 변수 FOOD_SAFETY_API_KEY로 설정'
  ],
  note: 'API 키가 없으면 샘플 데이터를 사용합니다.'
};