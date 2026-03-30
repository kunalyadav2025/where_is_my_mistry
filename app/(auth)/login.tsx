import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthApi } from '@/hooks/use-auth-api';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { sendOtp, isLoading, error, clearError } = useAuthApi();

  const [mobile, setMobile] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(params.mode === 'admin');

  // Update admin mode when params change
  useEffect(() => {
    if (params.mode === 'admin') {
      setIsAdminMode(true);
    }
  }, [params.mode]);

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/(tabs)');
      return true;
    });

    return () => backHandler.remove();
  }, [router]);

  const handleSendOtp = async () => {
    // Comprehensive Indian mobile number validation
    // Must be exactly 10 digits starting with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      );
      return;
    }

    const result = await sendOtp(mobile);

    if (result) {
      // Navigate to OTP verification screen
      router.push({
        pathname: '/(auth)/verify-otp' as any,
        params: { mobile, testOtp: result.testOtp || '', isAdminLogin: isAdminMode ? 'true' : '' },
      });
    }
  };

  const handleMobileChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length <= 10) {
      setMobile(cleaned);
      if (error) clearError();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>
          {isAdminMode ? 'Admin Login' : 'Where is My Mistry?'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          {isAdminMode
            ? 'Enter your admin mobile number'
            : 'Find skilled workers near you'}
        </Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: colors.text }]}>Mobile Number</Text>
          <View style={styles.inputContainer}>
            <Text style={[styles.prefix, { color: colors.text }]}>+91</Text>
            <TextInput
              style={[
                styles.input,
                { color: colors.text, borderColor: error ? '#ef4444' : colors.tabIconDefault },
              ]}
              placeholder="Enter 10-digit number"
              placeholderTextColor={colors.tabIconDefault}
              value={mobile}
              onChangeText={handleMobileChange}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: colors.tint },
              (isLoading || mobile.length !== 10) && styles.buttonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={isLoading || mobile.length !== 10}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.terms, { color: colors.tabIconDefault }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>

        <TouchableOpacity
          style={styles.adminLink}
          onPress={() => setIsAdminMode(!isAdminMode)}
        >
          <Text style={[styles.adminLinkText, { color: isAdminMode ? colors.tint : colors.tabIconDefault }]}>
            {isAdminMode ? '← Back to User Login' : 'Admin Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 18,
  },
  adminLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  adminLinkText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
