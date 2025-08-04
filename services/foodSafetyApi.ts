import { API_CONFIG, isUsingSampleData } from '../config/api';

// I2570 API 응답 (기존)
export interface I2570Response {
  I2570: {
    RESULT: {
      MSG: string;
      CODE: string;
    };
    row?: Array<{
      PRDLST_REPORT_NO: string;
      PRDLST_NM: string;
      BSSH_NM: string;
      MANUFACTURE_COUNTRY: string;
      PRDLST_DCNM: string;
      BRCD_NO: string;
      LAST_UPDT_DTM: string;
    }>;
    total_count: string;
  };
}

// C005 API 응답 (새로 추가)
export interface C005Response {
  C005: {
    RESULT: {
      MSG: string;
      CODE: string;
    };
    row?: Array<{
      PRDLST_REPORT_NO: string;
      PRDLST_NM: string;
      BSSH_NM: string;
      MANUFACTURE_COUNTRY: string;
      PRDLST_DCNM: string;
      BAR_CD: string;
      LAST_UPDT_DTM: string;
    }>;
    total_count: string;
  };
}

// 통합 응답 타입
export type FoodSafetyResponse = I2570Response | C005Response;

// 통합 상품 정보 타입
export interface ProductInfo {
  reportNo: string;
  productName: string;
  company: string;
  country: string;
  category: string;
  barcode: string;
  lastUpdated: string;
  source: 'I2570' | 'C005';
}

// I2570 API 호출 (기존)
async function searchI2570API(barcode: string): Promise<I2570Response | null> {
  const apiUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.FOOD_SAFETY_API_KEY}/I2570/json/1/${API_CONFIG.MAX_RESULTS}/BRCD_NO=${barcode}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`I2570 API HTTP error! status: ${response.status}`);
    }

    const data: I2570Response = await response.json();
    
    // API 응답 검증
    if (data.I2570.RESULT.CODE === 'INFO-000' && data.I2570.row && data.I2570.row.length > 0) {
      console.log('✅ I2570 API에서 제품을 찾았습니다:', data.I2570.row[0].PRDLST_NM);
      return data;
    } else {
      console.log('❌ I2570 API에서 제품을 찾지 못했습니다');
      return null;
    }
  } catch (error) {
    console.warn('I2570 API 호출 실패:', error);
    return null;
  }
}

// C005 API 호출 (새로 추가)
async function searchC005API(barcode: string): Promise<C005Response | null> {
  const apiUrl = `${API_CONFIG.BASE_URL}/${API_CONFIG.FOOD_SAFETY_API_KEY}/C005/json/1/${API_CONFIG.MAX_RESULTS}/BAR_CD=${barcode}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`C005 API HTTP error! status: ${response.status}`);
    }

    const data: C005Response = await response.json();
    
    // API 응답 검증
    if (data.C005.RESULT.CODE === 'INFO-000' && data.C005.row && data.C005.row.length > 0) {
      console.log('✅ C005 API에서 제품을 찾았습니다:', data.C005.row[0].PRDLST_NM);
      return data;
    } else {
      console.log('❌ C005 API에서 제품을 찾지 못했습니다');
      return null;
    }
  } catch (error) {
    console.warn('C005 API 호출 실패:', error);
    return null;
  }
}

// 두 API를 병렬로 호출하여 상품 검색
export async function searchFoodByBarcode(barcode: string): Promise<ProductInfo | null> {
  // 샘플 데이터 사용 시 로그 출력
  if (isUsingSampleData()) {
    console.log('⚠️  샘플 데이터를 사용 중입니다. 실제 데이터를 사용하려면 API 키를 설정하세요.');
    
    // 샘플 데이터용 테스트 바코드인지 확인
    if (barcode === '8801234567890' || barcode === '8012345678901') {
      console.log('📋 샘플 테스트 바코드 감지 - 샘플 데이터 반환');
      return {
        reportNo: 'SAMPLE-2024-001',
        productName: '샘플 테스트 제품',
        company: '샘플 제조사',
        country: '대한민국',
        category: '테스트 카테고리',
        barcode: barcode,
        lastUpdated: new Date().toISOString(),
        source: 'I2570'
      };
    }
  }

  console.log(`🔍 두 API로 바코드 검색 시작: ${barcode}`);

  try {
    // 두 API를 병렬로 호출
    const [i2570Result, c005Result] = await Promise.allSettled([
      searchI2570API(barcode),
      searchC005API(barcode)
    ]);

    console.log('🔍 API 결과 상세:');
    console.log('I2570 결과:', i2570Result);
    console.log('C005 결과:', c005Result);

    let productInfo: ProductInfo | null = null;

    // I2570 결과 우선 처리
    if (i2570Result.status === 'fulfilled' && i2570Result.value) {
      const data = i2570Result.value;
      const product = data.I2570.row![0];
      productInfo = {
        reportNo: product.PRDLST_REPORT_NO,
        productName: product.PRDLST_NM,
        company: product.BSSH_NM,
        country: product.MANUFACTURE_COUNTRY,
        category: product.PRDLST_DCNM,
        barcode: product.BRCD_NO,
        lastUpdated: product.LAST_UPDT_DTM,
        source: 'I2570'
      };
    }
    // I2570에서 찾지 못한 경우 C005 결과 사용
    else if (c005Result.status === 'fulfilled' && c005Result.value) {
      const data = c005Result.value;
      const product = data.C005.row![0];
      productInfo = {
        reportNo: product.PRDLST_REPORT_NO,
        productName: product.PRDLST_NM,
        company: product.BSSH_NM,
        country: product.MANUFACTURE_COUNTRY,
        category: product.PRDLST_DCNM,
        barcode: product.BAR_CD,
        lastUpdated: product.LAST_UPDT_DTM,
        source: 'C005'
      };
    }

    if (productInfo) {
      console.log(`✅ ${productInfo.source} API에서 제품 정보를 찾았습니다:`, productInfo.productName);
      return productInfo;
    } else {
      console.log('❌ 두 API 모두에서 제품을 찾지 못했습니다');
      return null;
    }

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('API 요청 시간이 초과되었습니다.');
    }
    console.error('Food Safety API 통합 호출 오류:', error);
    throw error;
  }
}

export function formatFoodInfo(productInfo: ProductInfo | null) {
  if (!productInfo) {
    return {
      success: false,
      message: '해당 바코드로 등록된 제품을 찾을 수 없습니다.'
    };
  }

  return {
    success: true,
    data: {
      reportNo: productInfo.reportNo,
      productName: productInfo.productName,
      company: productInfo.company,
      country: productInfo.country,
      category: productInfo.category,
      barcode: productInfo.barcode,
      lastUpdated: productInfo.lastUpdated,
      source: productInfo.source,
      sourceLabel: productInfo.source === 'I2570' ? '축산물이력제' : '식품등록정보'
    }
  };
}