import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ workerName: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
          <IconSymbol name="checkmark.circle.fill" size={80} color="#22c55e" />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Registration Successful!</Text>

        <Text style={[styles.message, { color: colors.tabIconDefault }]}>
          Congratulations {params.workerName}! Your profile has been submitted for review.
        </Text>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <IconSymbol name="clock.fill" size={24} color={colors.tint} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Pending Approval</Text>
            <Text style={[styles.infoText, { color: colors.tabIconDefault }]}>
              Our team will review your profile within 24-48 hours. You'll receive an SMS once approved.
            </Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <IconSymbol name="bell.fill" size={24} color={colors.tint} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>What's Next?</Text>
            <Text style={[styles.infoText, { color: colors.tabIconDefault }]}>
              Once approved, your profile will be visible to customers searching for workers in your area.
            </Text>
          </View>
        </View>

        <View style={styles.tips}>
          <Text style={[styles.tipsTitle, { color: colors.text }]}>Tips for Success</Text>
          <View style={styles.tipRow}>
            <IconSymbol name="camera.fill" size={16} color={colors.tint} />
            <Text style={[styles.tipText, { color: colors.tabIconDefault }]}>
              Add a profile photo to get more visibility
            </Text>
          </View>
          <View style={styles.tipRow}>
            <IconSymbol name="star.fill" size={16} color={colors.tint} />
            <Text style={[styles.tipText, { color: colors.tabIconDefault }]}>
              Ask satisfied customers to leave reviews
            </Text>
          </View>
          <View style={styles.tipRow}>
            <IconSymbol name="clock.fill" size={16} color={colors.tint} />
            <Text style={[styles.tipText, { color: colors.tabIconDefault }]}>
              Keep your availability status updated
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.tint }]}
          onPress={handleGoHome}
        >
          <IconSymbol name="house.fill" size={20} color="#fff" />
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    gap: 16,
    marginBottom: 16,
    width: '100%',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tips: {
    width: '100%',
    marginTop: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  button: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
