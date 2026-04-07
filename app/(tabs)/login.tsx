import React from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerDetail } from '@/hooks/use-workers';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function LoginTab() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading, logout } = useAuth();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Fetch worker data for authenticated users (all logged-in users are workers)
  const { worker, isLoading: isWorkerLoading, refetch } = useWorkerDetail(
    isAuthenticated && user?.workerId ? user.workerId : null
  );

  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(tabs)');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // NOT AUTHENTICATED - Redirect directly to login page (mobile number entry)
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Show loading for worker data
  if (isAuthenticated && isWorkerLoading && !worker) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.icon }]}>Loading profile...</Text>
      </View>
    );
  }

  // Show worker profile for authenticated users (all logged-in users are workers)
  if (isAuthenticated && worker) {
    return (
      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.tint}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: colors.tint }]}>
            {worker.profilePhotoUrl ? (
              <Image source={{ uri: worker.profilePhotoUrl }} style={styles.avatarImage} />
            ) : (
              <IconSymbol name="person.fill" size={48} color="#FFFFFF" />
            )}
          </View>
          <Text style={[styles.workerName, { color: colors.text }]}>{worker.name}</Text>
          <View style={styles.verificationBadge}>
            {worker.isVerified ? (
              <>
                <IconSymbol name="checkmark.seal.fill" size={16} color="#22c55e" />
                <Text style={[styles.verifiedText, { color: '#22c55e' }]}>Verified</Text>
              </>
            ) : (
              <>
                <IconSymbol name="clock.fill" size={16} color="#f59e0b" />
                <Text style={[styles.verifiedText, { color: '#f59e0b' }]}>Pending Verification</Text>
              </>
            )}
          </View>
        </View>

        {/* Profile Info Cards */}
        <View style={styles.infoSection}>
          {/* Category */}
          <View style={[styles.infoCard, { backgroundColor: colors.card || colors.background }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.tint + '20' }]}>
              <IconSymbol name="wrench.fill" size={20} color={colors.tint} />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Category</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{worker.categoryName}</Text>
            </View>
          </View>

          {/* Experience */}
          <View style={[styles.infoCard, { backgroundColor: colors.card || colors.background }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: '#10b981' + '20' }]}>
              <IconSymbol name="clock.fill" size={20} color="#10b981" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Experience</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {worker.experienceYears} {worker.experienceYears === 1 ? 'year' : 'years'}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View style={[styles.infoCard, { backgroundColor: colors.card || colors.background }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: '#8b5cf6' + '20' }]}>
              <IconSymbol name="location.fill" size={20} color="#8b5cf6" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Location</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {worker.townName}, {worker.districtName}
              </Text>
            </View>
          </View>

          {/* Mobile */}
          <View style={[styles.infoCard, { backgroundColor: colors.card || colors.background }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: '#f59e0b' + '20' }]}>
              <IconSymbol name="phone.fill" size={20} color="#f59e0b" />
            </View>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.icon }]}>Mobile</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>+91 {worker.mobile}</Text>
            </View>
          </View>
        </View>

        {/* Media Upload Section */}
        <View style={styles.mediaSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Photos & Videos</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.icon }]}>
            Upload your work photos and videos to get verified
          </Text>

          <View style={styles.mediaStatus}>
            <View style={styles.mediaStatusItem}>
              <IconSymbol
                name={worker.hasProfilePhoto ? 'checkmark.circle.fill' : 'circle'}
                size={20}
                color={worker.hasProfilePhoto ? '#22c55e' : colors.icon}
              />
              <Text style={[styles.mediaStatusText, { color: colors.text }]}>Profile Photo</Text>
            </View>
            <View style={styles.mediaStatusItem}>
              <IconSymbol
                name={worker.workPhotoCount >= 1 ? 'checkmark.circle.fill' : 'circle'}
                size={20}
                color={worker.workPhotoCount >= 1 ? '#22c55e' : colors.icon}
              />
              <Text style={[styles.mediaStatusText, { color: colors.text }]}>
                Work Photos ({worker.workPhotoCount}/5)
              </Text>
            </View>
            <View style={styles.mediaStatusItem}>
              <IconSymbol
                name={worker.hasWorkVideo ? 'checkmark.circle.fill' : 'circle'}
                size={20}
                color={worker.hasWorkVideo ? '#22c55e' : colors.icon}
              />
              <Text style={[styles.mediaStatusText, { color: colors.text }]}>Work Video</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.uploadButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(mistry)/media' as any)}
          >
            <IconSymbol name="camera.fill" size={20} color="#FFFFFF" />
            <Text style={styles.uploadButtonText}>Upload Photos / Videos</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card || colors.background }]}
            onPress={() => router.push('/(mistry)/profile' as any)}
          >
            <IconSymbol name="pencil" size={20} color={colors.tint} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Edit Profile</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.card || colors.background }]}
            onPress={() => router.push({ pathname: '/worker/[id]', params: { id: worker.workerId } })}
          >
            <IconSymbol name="eye.fill" size={20} color="#8b5cf6" />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>View Public Profile</Text>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: '#ef4444' }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Fallback - worker data not found, show loading or error
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.tint} />
      <Text style={[styles.loadingText, { color: colors.icon }]}>Loading profile...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  workerName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    gap: 12,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
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
  mediaSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  mediaStatus: {
    gap: 12,
    marginBottom: 16,
  },
  mediaStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaStatusText: {
    fontSize: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionSection: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'center',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
