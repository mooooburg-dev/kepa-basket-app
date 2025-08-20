import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState, useRef, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import BarcodeScanner from './components/BarcodeScanner';

export default function App() {
  const [mode, setMode] = useState<'web' | 'scan'>('web');
  const [webViewLoaded, setWebViewLoaded] = useState(false);
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
  };

  // 바코드 스캔 성공 핸들러 - 바코드만 WebView로 전달
  const handleBarcodeScanned = (barcode: string) => {
    const scanId = `scan_${Date.now()}`;
    
    console.log(`🔍 [${scanId}] 바코드 스캔 완료:`, barcode);

    // 바코드 정보만 WebView로 전송 (API 호출은 웹에서 처리)
    const message = JSON.stringify({
      type: 'barcode_scanned',
      data: {
        barcode: barcode,
        scanId: scanId,
        timestamp: Date.now(),
      },
    });

    console.log(`📤 [${scanId}] WebView로 바코드 전송:`, barcode);

    if (webViewLoaded && webViewRef.current) {
      webViewRef.current.postMessage(message);
      console.log(`✅ [${scanId}] 바코드 전송 완료`);
    } else {
      console.warn(`⚠️ [${scanId}] WebView가 준비되지 않음`);
    }

    // 웹 모드로 전환
    setMode('web');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* WebView를 항상 렌더링하되, 스캔 모드일 때는 숨김 */}
        <WebView
          ref={webViewRef}
          // source={{ uri: 'http://192.168.123.104:3000' }}
          source={{ uri: 'http://192.168.123.104:3001' }}
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
