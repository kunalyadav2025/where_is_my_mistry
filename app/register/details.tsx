import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkerRegistration } from '@/hooks/use-worker-registration';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    mobile: string;
    categoryId: string;
    categoryName: string;
    experienceYears: string;
    stateId: string;
    stateName: string;
    districtId: string;
    districtName: string;
    tehsilId: string;
    tehsilName: string;
    townId: string;
    townName: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { registerWorker, isLoading, error } = useWorkerRegistration();

  const [aadhaar, setAadhaar] = useState('');
  const [bio, setBio] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formatAadhaar = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted.substring(0, 14); // 12 digits + 2 spaces
  };

  const handleAadhaarChange = (text: string) => {
    setAadhaar(formatAadhaar(text));
  };

  const validateAadhaar = (aadhaarNum: string) => {
    const cleaned = aadhaarNum.replace(/\s/g, '');
    return /^\d{12}$/.test(cleaned);
  };

  const handleSubmit = async () => {
    const cleanedAadhaar = aadhaar.replace(/\s/g, '');

    if (!validateAadhaar(aadhaar)) {
      Alert.alert('Invalid Aadhaar', 'Please enter a valid 12-digit Aadhaar number');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the terms and conditions');
      return;
    }

    const result = await registerWorker({
      name: params.name,
      mobile: params.mobile,
      categoryId: params.categoryId,
      categoryName: params.categoryName,
      experienceYears: parseInt(params.experienceYears, 10),
      stateId: params.stateId,
      stateName: params.stateName,
      districtId: params.districtId,
      districtName: params.districtName,
      tehsilId: params.tehsilId,
      tehsilName: params.tehsilName,
      townId: params.townId,
      townName: params.townName,
      aadhaarNumber: cleanedAadhaar,
      bio: bio.trim() || undefined,
    });

    if (result) {
      router.replace({
        pathname: '/register/success' as any,
        params: { workerName: params.name },
      });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={colors.tint} />
          <Text style={[styles.backText, { color: colors.tint }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepDot, styles.stepActive, { backgroundColor: colors.tint }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Final Details</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Step 3: Verification & Bio
        </Text>

        {/* Summary Card */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Registration Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Name:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{params.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Mobile:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>+91 {params.mobile}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Category:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{params.categoryName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Experience:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>{params.experienceYears} years</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.tabIconDefault }]}>Location:</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {params.townName}, {params.districtName}
            </Text>
          </View>
        </View>

        {/* Aadhaar Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Aadhaar Number *</Text>
          <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Required for verification. We only store the last 4 digits.
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="XXXX XXXX XXXX"
            placeholderTextColor={colors.tabIconDefault}
            value={aadhaar}
            onChangeText={handleAadhaarChange}
            keyboardType="number-pad"
            maxLength={14}
          />
          <View style={styles.securityNote}>
            <IconSymbol name="lock.fill" size={14} color="#22c55e" />
            <Text style={[styles.securityText, { color: colors.tabIconDefault }]}>
              Your Aadhaar is encrypted and securely stored
            </Text>
          </View>
        </View>

        {/* Bio Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>About You (Optional)</Text>
          <Text style={[styles.helperText, { color: colors.tabIconDefault }]}>
            Tell customers about your skills and experience
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { color: colors.text, borderColor: colors.tabIconDefault },
            ]}
            placeholder="e.g., I have 5 years of experience in plumbing. I specialize in bathroom fittings and pipeline repairs..."
            placeholderTextColor={colors.tabIconDefault}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={[styles.charCount, { color: colors.tabIconDefault }]}>
            {bio.length}/500
          </Text>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setAgreedToTerms(!agreedToTerms)}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: agreedToTerms ? colors.tint : 'transparent',
                borderColor: agreedToTerms ? colors.tint : colors.tabIconDefault,
              },
            ]}
          >
            {agreedToTerms && <IconSymbol name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.termsText, { color: colors.text }]}>
            I agree to the{' '}
            <Text style={{ color: colors.tint }}>Terms of Service</Text> and{' '}
            <Text style={{ color: colors.tint }}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        {error && (
          <View style={styles.errorContainer}>
            <IconSymbol name="exclamationmark.circle.fill" size={16} color="#ef4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.tint },
            (isLoading || !validateAadhaar(aadhaar) || !agreedToTerms) && styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isLoading || !validateAadhaar(aadhaar) || !agreedToTerms}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Complete Registration</Text>
              <IconSymbol name="checkmark.circle.fill" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 4,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  stepActive: {},
  stepLine: {
    width: 24,
    height: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  summaryLabel: {
    width: 90,
    fontSize: 14,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  securityText: {
    fontSize: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    marginTop: 8,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
