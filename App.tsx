import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { SafeAreaView } from 'react-native';

export default function App() {
  const [mode, setMode] = useState<'web' | 'scan'>('web');

  const handleMessage = (event: any) => {
    const data = event.nativeEvent.data;
    if (data === 'scanBarcode') {
      setMode('scan');
    }
  };

  const handleBackToWeb = () => {
    setMode('web');
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        {mode === 'web' ? (
          <WebView
            source={{ uri: 'http://192.168.123.111:3003' }}
            style={{ flex: 1 }}
            onMessage={handleMessage}
            javaScriptEnabled
          />
        ) : (
          <View style={styles.container}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBackToWeb}
            >
              <Text style={styles.backButtonText}>← 이전 화면</Text>
            </TouchableOpacity>
            <Text style={{ textAlign: 'center', marginTop: 100 }}>
              여기에 바코드 스캐너 연결 예정
            </Text>
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
});
