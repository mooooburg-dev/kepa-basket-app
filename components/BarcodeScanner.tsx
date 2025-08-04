import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, Button, Dimensions, TouchableOpacity, Vibration } from 'react-native';
import { CameraView, Camera, FlashMode } from 'expo-camera';

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onCancel: () => void;
}

export default function BarcodeScanner({ onScanSuccess, onCancel }: BarcodeScannerProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<string>('');
  const [scanAttempts, setScanAttempts] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScanTime = useRef<number>(0);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    const now = Date.now();
    
    // 너무 빠른 연속 스캔 방지 (500ms 간격)
    if (now - lastScanTime.current < 500) {
      return;
    }
    
    // 이미 스캔 완료된 상태면 무시
    if (scanned || scanning) return;
    
    // 바코드 데이터 유효성 검증
    if (!data || data.length < 8 || data.length > 20) {
      console.log(`Invalid barcode length: ${data.length}, data: ${data}`);
      setScanAttempts(prev => prev + 1);
      return;
    }
    
    // 숫자만 포함하는지 확인 (일부 바코드는 문자 포함 가능)
    if (!/^[0-9A-Za-z\-]+$/.test(data)) {
      console.log(`Invalid barcode format: ${data}`);
      setScanAttempts(prev => prev + 1);
      return;
    }
    
    // 같은 데이터가 연속으로 스캔되는 경우 중복 방지
    if (data === lastScannedData && now - lastScanTime.current < 2000) {
      console.log(`Duplicate scan prevented: ${data}`);
      return;
    }
    
    setScanning(true);
    setScanned(true);
    setLastScannedData(data);
    lastScanTime.current = now;
    
    // 스캔 성공 시 진동 피드백
    Vibration.vibrate([100, 50, 100]);
    
    console.log(`✅ Valid barcode scanned: type=${type}, data=${data}, length=${data.length}`);
    
    // 스캔 결과 처리 전 잠시 대기 (시각적 피드백)
    setTimeout(() => {
      onScanSuccess(data);
    }, 500);
  };

  const resetScan = () => {
    setScanned(false);
    setScanning(false);
    setScanAttempts(0);
    setLastScannedData('');
    lastScanTime.current = 0;
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
  };

  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한을 요청하는 중...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>카메라 권한이 없습니다</Text>
        <Button title="돌아가기" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        flash={flashOn ? 'on' : 'off'}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "code93"],
        }}
        enableTorch={flashOn}
        autofocus="on"
        ratio="16:9"
        pictureSize="1920x1080"
      />
      
      {/* 스캔 영역 오버레이 */}
      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={[styles.scanArea, scanned && styles.scanAreaSuccess]}>
            <View style={styles.cornerTopLeft} />
            <View style={styles.cornerTopRight} />
            <View style={styles.cornerBottomLeft} />
            <View style={styles.cornerBottomRight} />
            {scanning && <View style={styles.scanLine} />}
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlayBg} />
      </View>

      {/* 상단 컨트롤 */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={onCancel}>
          <Text style={styles.controlButtonText}>✕</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <Text style={styles.controlButtonText}>{flashOn ? '💡' : '🔦'}</Text>
        </TouchableOpacity>
      </View>

      {/* 하단 정보 및 컨트롤 */}
      <View style={styles.bottomInfo}>
        <Text style={styles.instructionText}>
          {scanned 
            ? '바코드 스캔 완료!' 
            : scanning
            ? '스캔 중...'
            : '바코드를 스캔 영역에 맞춰주세요'
          }
        </Text>
        <Text style={styles.tipText}>
          {scanned 
            ? `스캔된 데이터: ${lastScannedData}`
            : scanAttempts > 0 
            ? `스캔 시도: ${scanAttempts}회 - 바코드를 더 가까이 대보세요`
            : '바코드가 잘 보이도록 충분한 조명이 필요합니다'
          }
        </Text>
        <Text style={styles.debugText}>
          💡 팁: 바코드를 수평으로 맞추고 15-20cm 거리에서 스캔하세요
        </Text>
        {scanned && (
          <TouchableOpacity style={styles.rescanButton} onPress={resetScan}>
            <Text style={styles.rescanButtonText}>다시 스캔</Text>
          </TouchableOpacity>
        )}
        {scanAttempts > 5 && !scanned && (
          <TouchableOpacity style={styles.helpButton} onPress={() => {
            setScanAttempts(0);
            setFlashOn(!flashOn);
          }}>
            <Text style={styles.helpButtonText}>
              {flashOn ? '플래시 끄기' : '플래시 켜기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const scanAreaSize = Math.min(width * 0.7, 280);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
    color: 'white',
    textAlign: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleRow: {
    flexDirection: 'row',
    height: scanAreaSize,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomOverlayBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  scanArea: {
    width: scanAreaSize,
    height: scanAreaSize,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanAreaSuccess: {
    backgroundColor: 'rgba(0, 255, 0, 0.1)',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 30,
    height: 30,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#00FF00',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 30,
    height: 30,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#00FF00',
  },
  scanLine: {
    position: 'absolute',
    top: scanAreaSize / 2 - 1,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#FF6B35',
    opacity: 0.8,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  controlButtonText: {
    fontSize: 20,
    color: 'white',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  rescanButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 10,
  },
  rescanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  debugText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  helpButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  helpButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});