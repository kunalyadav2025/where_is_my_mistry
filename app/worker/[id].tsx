import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkerDetail } from '@/hooks/use-workers';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WorkerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { worker, isLoading, error, refetch } = useWorkerDetail(id);

  const handleCall = () => {
    if (!worker) return;
    const phoneNumber = `tel:+91${worker.mobile}`;
    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          Linking.openURL(phoneNumber);
        } else {
          Alert.alert('Error', 'Unable to make phone calls on this device');
        }
      })
      .catch((err) => console.error('Error opening phone:', err));
  };

  const handleWhatsApp = () => {
    if (!worker) return;
    const whatsappUrl = `whatsapp://send?phone=91${worker.mobile}`;
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to use this feature');
        }
      })
      .catch((err) => console.error('Error opening WhatsApp:', err));
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<IconSymbol key={i} name="star.fill" size={20} color="#f59e0b" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<IconSymbol key={i} name="star.leadinghalf.filled" size={20} color="#f59e0b" />);
      } else {
        stars.push(<IconSymbol key={i} name="star" size={20} color="#d1d5db" />);
      }
    }
    return stars;
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
          Loading profile...
        </Text>
      </View>
    );
  }

  if (error || !worker) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color={colors.tint} />
            <Text style={[styles.backText, { color: colors.tint }]}>Back</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ef4444" />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Worker Not Found</Text>
          <Text style={[styles.errorText, { color: colors.tabIconDefault }]}>
            {error || 'This worker profile may have been removed'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.tint }]}
            onPress={refetch}
          >
            <Text style={[styles.retryText, { color: colors.tint }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={colors.tint} />
          <Text style={[styles.backText, { color: colors.tint }]}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {worker.profilePhotoUrl ? (
              <Image source={{ uri: worker.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '30' }]}>
                <IconSymbol name="person.fill" size={48} color={colors.tint} />
              </View>
            )}
            {worker.isAvailable && (
              <View style={styles.availableBadge}>
                <View style={styles.availableDot} />
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.text }]}>{worker.name}</Text>
          <Text style={[styles.category, { color: colors.tint }]}>{worker.categoryName}</Text>

          <View style={styles.ratingContainer}>
            <View style={styles.stars}>{renderStars(worker.avgRating)}</View>
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {worker.avgRating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: colors.tabIconDefault }]}>
              ({worker.reviewCount} reviews)
            </Text>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: worker.isAvailable ? '#dcfce7' : '#fef2f2' }]}>
            <View style={[styles.statusDot, { backgroundColor: worker.isAvailable ? '#22c55e' : '#ef4444' }]} />
            <Text style={[styles.statusText, { color: worker.isAvailable ? '#166534' : '#991b1b' }]}>
              {worker.isAvailable ? 'Available for work' : 'Currently unavailable'}
            </Text>
          </View>
        </View>

        {/* Info Cards */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="clock.fill" size={24} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Experience</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {worker.experienceYears} years
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="location.fill" size={24} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Location</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {worker.townName}, {worker.tehsilName}
              </Text>
              <Text style={[styles.infoSubvalue, { color: colors.tabIconDefault }]}>
                {worker.districtName}, {worker.stateName}
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="eye.fill" size={24} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>Profile Views</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{worker.viewCount}</Text>
            </View>
          </View>

          {worker.aadhaarLast4 && (
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="checkmark.shield.fill" size={24} color="#22c55e" />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.tabIconDefault }]}>
                  Aadhaar Verified
                </Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  XXXX-XXXX-{worker.aadhaarLast4}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Bio Section */}
        {worker.bio && (
          <View style={styles.bioSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.bioText, { color: colors.tabIconDefault }]}>{worker.bio}</Text>
          </View>
        )}

        {/* Spacer for bottom buttons */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Contact Buttons */}
      <View style={[styles.contactBar, { backgroundColor: colors.background, borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.contactButton, styles.whatsappButton]}
          onPress={handleWhatsApp}
        >
          <IconSymbol name="message.fill" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactButton, { backgroundColor: colors.tint }]}
          onPress={handleCall}
        >
          <IconSymbol name="phone.fill" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
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
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#22c55e',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  category: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoSubvalue: {
    fontSize: 14,
    marginTop: 2,
  },
  bioSection: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  contactBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    gap: 12,
    borderTopWidth: 1,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  whatsappButton: {
    backgroundColor: '#25d366',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
