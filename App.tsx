import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import BarcodeScanner from './components/BarcodeScanner';
import { searchFoodByBarcode, formatFoodInfo } from './services/foodSafetyApi';
import { isUsingSampleData } from './config/api';

export default function App() {
  const [mode, setMode] = useState<'web' | 'scan'>('web');
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [pendingScanResult, setPendingScanResult] = useState<string | null>(
    null
  );
  const [lastScanResult, setLastScanResult] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    const data = event.nativeEvent.data;
    console.log('📨 WebView로부터 메시지 수신:', data);

    try {
      // JSON 메시지인지 확인
      const parsedData = JSON.parse(data);

      if (parsedData.type === 'scanBarcode') {
        console.log('🎯 바코드 스캔 요청 받음');
        // WebView 상태를 리셋하지 않고 스캔 모드로만 전환
        setMode('scan');
      } else if (parsedData.type === 'debug') {
        console.log('🐛 디버그 메시지:', parsedData.message);
      } else {
        console.log('🔄 알 수 없는 메시지 타입:', parsedData.type);
      }
    } catch (error) {
      // 단순 문자열 메시지인 경우
      if (data === 'scanBarcode') {
        console.log('🎯 바코드 스캔 요청 받음 (문자열)');
        setMode('scan');
      } else {
        console.log('📝 단순 메시지:', data);
      }
    }
  };

  const handleBackToWeb = () => {
    console.log('🔄 스캔 모드에서 웹 모드로 복귀');
    setMode('web');

    // WebView 상태를 리셋하지 않음 - 기존 상태 유지
  };

  // mode가 web으로 변경될 때 보류된 메시지 전송
  useEffect(() => {
    if (
      mode === 'web' &&
      lastScanResult &&
      webViewRef.current &&
      webViewLoaded
    ) {
      console.log('🔄 웹 모드로 전환됨 - 보류된 스캔 결과 전송');

      // WebView가 완전히 활성화될 때까지 약간의 지연
      setTimeout(() => {
        if (webViewRef.current) {
          console.log('📤 보류된 스캔 결과 전송:', lastScanResult);
          webViewRef.current.postMessage(lastScanResult);
          setLastScanResult(null); // 전송 후 초기화
        }
      }, 100);
    }
  }, [mode, lastScanResult, webViewLoaded]);

  // 디버깅용 메시지 전송 함수
  const sendDebugMessage = (message: string, data?: any) => {
    const debugMessage = JSON.stringify({
      type: 'debug_from_native',
      message,
      data,
      timestamp: Date.now(),
      source: 'react-native',
    });

    webViewRef.current?.postMessage(debugMessage);
    console.log('🐛 디버그 메시지 전송:', message, data);
  };

  // 실제 바코드 스캔 성공 핸들러
  const handleBarcodeScanned = async (barcode: string) => {
    const scanStartTime = Date.now();
    const scanId = `scan_${scanStartTime}`;

    try {
      console.log(`🔍 [${scanId}] 바코드 스캔 시작:`, barcode);

      // 샘플 데이터 사용 시 사용자에게 알림
      const usingSample = isUsingSampleData();
      if (usingSample) {
        console.log(`📋 [${scanId}] 샘플 데이터로 검색 중...`);
      }

      // Food Safety Korea API로 식품 정보 조회
      console.log(`🌐 [${scanId}] API 호출 시작... 바코드: ${barcode}`);
      const foodData = await searchFoodByBarcode(barcode);
      const apiEndTime = Date.now();
      const apiDuration = apiEndTime - scanStartTime;

      console.log(`⏱️ [${scanId}] API 호출 완료 (${apiDuration}ms)`);
      console.log(
        `📦 [${scanId}] 받은 원본 데이터:`,
        JSON.stringify(foodData, null, 2)
      );

      const formattedInfo = formatFoodInfo(foodData);
      console.log(
        `🔄 [${scanId}] 포맷된 데이터:`,
        JSON.stringify(formattedInfo, null, 2)
      );

      // 공통 디버깅 정보
      const debugInfo = {
        scanId,
        scanTime: new Date(scanStartTime).toISOString(),
        barcode,
        barcodeLength: barcode.length,
        apiDuration,
        usingSampleData: usingSample,
        apiKey: usingSample ? 'sample' : 'real',
        timestamp: Date.now(),
      };

      if (formattedInfo.success && formattedInfo.data) {
        // 식품 정보를 포함한 메시지를 WebView로 전송
        const message = JSON.stringify({
          type: 'barcode_success',
          success: true,
          data: {
            barcode: barcode,
            productInfo: {
              reportNo: formattedInfo.data.reportNo,
              productName: formattedInfo.data.productName,
              company: formattedInfo.data.company,
              country: formattedInfo.data.country,
              category: formattedInfo.data.category,
              barcode: formattedInfo.data.barcode,
              lastUpdated: formattedInfo.data.lastUpdated,
              source: formattedInfo.data.source,
              sourceLabel: formattedInfo.data.sourceLabel,
              isUsingRealData: !usingSample,
            },
            debug: {
              ...debugInfo,
              foundIn: formattedInfo.data.source,
              sourceLabel: formattedInfo.data.sourceLabel,
              searchResult: 'found',
            },
          },
        });

        console.log(
          `📤 [${scanId}] WebView로 전송할 메시지:`,
          JSON.parse(message)
        );

        // 스캔 결과를 저장 (나중에 전송하기 위해)
        setLastScanResult(message);

        // WebView가 로드된 상태라면 즉시 전송 시도
        if (webViewLoaded && webViewRef.current) {
          // 디버깅: 메시지 전송 직전 상태 확인
          console.log(`🚀 [${scanId}] postMessage 호출 직전:`, {
            webViewLoaded,
            hasWebViewRef: !!webViewRef.current,
            messageLength: message.length,
            mode,
          });

          // 스캔 모드에서는 전송하지 않고 보류
          if (mode === 'scan') {
            console.warn(`⚠️ [${scanId}] 스캔 모드에서는 메시지 전송 보류`);
            setPendingScanResult(message);
          } else {
            webViewRef.current.postMessage(message);
            console.log(`✅ [${scanId}] 제품 정보 전송 완료:`, {
              product: formattedInfo.data.productName,
              source: formattedInfo.data.sourceLabel,
              company: formattedInfo.data.company,
            });
          }
        } else {
          console.warn(`⚠️ [${scanId}] WebView가 준비되지 않음 - 메시지 보류`);
          setPendingScanResult(message);
        }
      } else {
        // 제품을 찾을 수 없는 경우에도 바코드는 전송
        const message = JSON.stringify({
          type: 'barcode_not_found',
          success: false,
          data: {
            barcode: barcode,
            error: formattedInfo.message,
            debug: {
              ...debugInfo,
              searchResult: 'not_found',
              searchedAPIs: ['I2570', 'C005'],
            },
          },
        });

        console.log(
          `📤 [${scanId}] WebView로 전송할 메시지 (제품 없음):`,
          JSON.parse(message)
        );

        if (webViewLoaded && webViewRef.current) {
          webViewRef.current.postMessage(message);
          console.log(`❌ [${scanId}] 제품 정보 없음:`, formattedInfo.message);
        } else {
          console.warn(
            `⚠️ [${scanId}] WebView가 준비되지 않음 - 메시지 보류 (제품 없음)`
          );
          setPendingScanResult(message);
        }
      }

      // 웹 모드로 전환 (setTimeout은 제거 - useEffect에서 처리)
      setMode('web');
    } catch (error) {
      const errorEndTime = Date.now();
      const totalDuration = errorEndTime - scanStartTime;

      console.error(
        `💥 [${scanId}] 바코드 처리 중 오류 (${totalDuration}ms):`,
        error
      );

      let errorMessage = '식품 정보를 가져오는 중 오류가 발생했습니다.';
      let errorCode = 'UNKNOWN_ERROR';

      if (error instanceof Error) {
        if (error.message.includes('시간이 초과')) {
          errorMessage =
            'API 요청 시간이 초과되었습니다. 네트워크를 확인해주세요.';
          errorCode = 'TIMEOUT_ERROR';
        } else if (error.message.includes('등록된 제품이 없습니다')) {
          errorMessage = '해당 바코드로 등록된 제품이 없습니다.';
          errorCode = 'NOT_FOUND_ERROR';
        } else if (error.message.includes('HTTP error')) {
          errorMessage = 'API 서버 연결에 실패했습니다.';
          errorCode = 'API_ERROR';
        }
      }

      // 에러 정보를 포함한 메시지를 WebView로 전송
      const errorMessage_json = JSON.stringify({
        type: 'barcode_error',
        success: false,
        data: {
          barcode: barcode,
          error: errorMessage,
          debug: {
            scanId,
            scanTime: new Date(scanStartTime).toISOString(),
            barcode,
            barcodeLength: barcode.length,
            totalDuration,
            usingSampleData: isUsingSampleData(),
            errorCode,
            errorDetails:
              error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            timestamp: Date.now(),
            searchResult: 'error',
          },
        },
      });

      console.log(
        `📤 [${scanId}] WebView로 전송할 메시지 (에러):`,
        JSON.parse(errorMessage_json)
      );

      if (webViewLoaded && webViewRef.current) {
        webViewRef.current.postMessage(errorMessage_json);
      } else {
        console.warn(
          `⚠️ [${scanId}] WebView가 준비되지 않음 - 메시지 보류 (에러 상황)`
        );
        setPendingScanResult(errorMessage_json);
      }

      Alert.alert('오류', errorMessage);
      setMode('web');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* WebView를 항상 렌더링하되, 스캔 모드일 때는 숨김 */}
        <WebView
          ref={webViewRef}
          source={{ uri: 'http://192.168.123.104:3000' }}
          // source={{ uri: 'http://192.168.1.153:3000' }}
          style={[
            { flex: 1 },
            mode === 'scan' && { position: 'absolute', left: -1000 }, // 스캔 모드일 때 화면 밖으로 이동
          ]}
          onMessage={handleMessage}
          injectedJavaScript={`
            // WebView 통신 준비 확인
            (function() {
              console.log('🔧 WebView JavaScript 준비 완료');
            })();
            true;
          `}
          onLoad={() => {
            setWebViewLoaded(true);
            console.log('🌐 WebView 로드 완료');
            sendDebugMessage('WebView loaded successfully', {
              timestamp: Date.now(),
              userAgent: 'React Native WebView',
            });

            // 보류된 스캔 결과가 있으면 전송
            if (pendingScanResult) {
              console.log('📤 보류된 스캔 결과 재전송:', pendingScanResult);
              setTimeout(() => {
                if (webViewRef.current) {
                  webViewRef.current.postMessage(pendingScanResult);
                  setPendingScanResult(null);
                }
              }, 500); // 0.5초 후 전송
            }
          }}
          onError={(error) => {
            console.error('🚨 WebView 로드 에러:', error);
            setWebViewLoaded(false);
          }}
          onLoadStart={() => {
            console.log('🔄 WebView 로드 시작');
            setWebViewLoaded(false);
          }}
          onLoadEnd={() => {
            console.log('✅ WebView 로드 종료');
          }}
          javaScriptEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback
        />

        {/* 스캔 모드일 때만 바코드 스캐너 표시 */}
        {mode === 'scan' && (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: 'black' },
            ]}
          >
            <BarcodeScanner
              onScanSuccess={handleBarcodeScanned}
              onCancel={handleBackToWeb}
            />
          </View>
        )}

        <StatusBar style="auto" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scanContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scanContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  scanTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scanDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 1,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
