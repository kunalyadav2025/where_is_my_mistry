import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  Linking,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useLocation } from '@/hooks/use-location';
import { useLocationResolver } from '@/hooks/use-location-resolver';
import { useNearbyWorkers } from '@/hooks/use-workers';
import { useAuth } from '@/contexts/AuthContext';
import { CategoryFilterChips } from '@/components/CategoryFilterChips';
import { WorkerListSkeleton } from '@/components/SkeletonLoader';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Worker } from '@/shared/types';

// Profession colors for avatar backgrounds
const PROFESSION_COLORS: Record<string, string> = {
  plumber: '#3B82F6',
  electrician: '#F59E0B',
  painter: '#EC4899',
  'raj-mistry': '#8B5CF6',
  carpenter: '#D97706',
  welder: '#EF4444',
  'ac-repair': '#06B6D4',
  'washing-machine': '#6366F1',
  'cycle-repair': '#10B981',
  'bike-service': '#F97316',
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isAuthenticated } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Location hooks
  const {
    geocoded,
    isLoading: isLocationLoading,
    error: locationError,
    permissionStatus,
    requestPermission,
    refresh: refreshLocation,
  } = useLocation();

  const {
    resolvedLocation,
    isLoading: isResolvingLocation,
    error: resolveError,
  } = useLocationResolver({
    district: geocoded?.district,
    state: geocoded?.state,
  });

  // Workers hook
  const {
    workers,
    isLoading: isLoadingWorkers,
    error: workersError,
    refresh: refreshWorkers,
  } = useNearbyWorkers({
    townId: resolvedLocation?.townId,
    categoryId: selectedCategory,
  });

  const isLoading = isLocationLoading || isResolvingLocation || isLoadingWorkers;

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshLocation();
    refreshWorkers();
    setIsRefreshing(false);
  }, [refreshLocation, refreshWorkers]);

  const handleRegisterPress = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
    } else {
      router.push('/register' as any);
    }
  };

  const handleWorkerPress = (worker: Worker) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: {
        workerId: worker.workerId,
        categoryId: worker.categoryId,
        categoryName: worker.categoryName,
      },
    });
  };

  const handleCallPress = (mobile: string) => {
    Linking.openURL(`tel:+91${mobile}`);
  };

  const handleWhatsAppPress = (mobile: string) => {
    Linking.openURL(`https://wa.me/91${mobile}`);
  };

  const handleRequestPermission = async () => {
    await requestPermission();
  };

  const getAvatarColor = (categoryId: string): string => {
    return PROFESSION_COLORS[categoryId] || colors.primary;
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const locationDisplayName = geocoded
    ? geocoded.city || geocoded.district || 'Unknown Location'
    : 'Detecting...';

  const renderWorkerCard = ({ item: worker }: { item: Worker }) => (
    <TouchableOpacity
      style={[styles.workerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => handleWorkerPress(worker)}
      activeOpacity={0.7}
    >
      {/* Card Header */}
      <View style={styles.cardHeader}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            { backgroundColor: getAvatarColor(worker.categoryId) + '20' },
          ]}
        >
          <Text
            style={[styles.avatarText, { color: getAvatarColor(worker.categoryId) }]}
          >
            {getInitials(worker.name)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.cardInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.workerName, { color: colors.text }]} numberOfLines={1}>
              {worker.name}
            </Text>
            {/* Availability Dot */}
            <View
              style={[
                styles.availabilityDot,
                { backgroundColor: worker.isAvailable ? colors.available : colors.busy },
              ]}
            />
          </View>

          {/* Profession Badge */}
          <View style={styles.badgeRow}>
            <View style={[styles.professionBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.professionText, { color: colors.primary }]}>
                {worker.categoryName}
              </Text>
            </View>
            {worker.aadhaarLast4 && (
              <View style={[styles.verifiedBadge, { backgroundColor: colors.verified + '15' }]}>
                <IconSymbol name="checkmark.shield.fill" size={12} color={colors.verified} />
                <Text style={[styles.verifiedText, { color: colors.verified }]}>Verified</Text>
              </View>
            )}
          </View>

          {/* Location & Experience */}
          <View style={styles.detailsRow}>
            <View style={styles.locationContainer}>
              <IconSymbol name="mappin" size={12} color={colors.tabIconDefault} />
              <Text style={[styles.locationText, { color: colors.tabIconDefault }]}>
                {worker.townName || worker.districtName}
              </Text>
            </View>
            <Text style={[styles.experienceText, { color: colors.tabIconDefault }]}>
              {worker.experienceYears} yrs exp
            </Text>
          </View>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <IconSymbol name="star.fill" size={14} color="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {worker.avgRating.toFixed(1)}
            </Text>
            <Text style={[styles.reviewCount, { color: colors.tabIconDefault }]}>
              ({worker.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      {/* Card Footer - CTA Buttons */}
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={[styles.ctaButton, styles.callButton, { backgroundColor: colors.available }]}
          onPress={() => handleCallPress(worker.mobile)}
          activeOpacity={0.8}
        >
          <IconSymbol name="phone.fill" size={16} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>Call</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ctaButton, styles.whatsappButton, { borderColor: colors.available }]}
          onPress={() => handleWhatsAppPress(worker.mobile)}
          activeOpacity={0.8}
        >
          <IconSymbol name="message.fill" size={16} color={colors.available} />
          <Text style={[styles.whatsappButtonText, { color: colors.available }]}>WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (permissionStatus === Location.PermissionStatus.DENIED) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="location.slash.fill" size={64} color={colors.tabIconDefault} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Location Access Required
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
            Enable location to find mistries near you
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.enableButtonText}>Enable Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (locationError || resolveError) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#F59E0B" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Location Error</Text>
          <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
            {locationError || resolveError}
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={handleRequestPermission}
          >
            <Text style={styles.enableButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (workersError) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="exclamationmark.triangle.fill" size={64} color="#EF4444" />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Failed to load</Text>
          <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
            {workersError}
          </Text>
          <TouchableOpacity
            style={[styles.enableButton, { backgroundColor: colors.primary }]}
            onPress={refreshWorkers}
          >
            <Text style={styles.enableButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="person.2.slash.fill" size={64} color={colors.tabIconDefault} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No mistries found</Text>
        <Text style={[styles.emptySubtitle, { color: colors.tabIconDefault }]}>
          No mistries found near you.{'\n'}Try a different category.
        </Text>
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.listHeader}>
      <Text style={[styles.listTitle, { color: colors.text }]}>
        {workers.length} {workers.length === 1 ? 'mistry' : 'mistries'} near you
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />

      {/* Zone 1: Fixed Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.background }]}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.brandContainer}>
            <Text style={[styles.brandName, { color: colors.text }]}>मेरा मिस्त्री</Text>
            <View style={styles.locationRow}>
              <IconSymbol name="mappin.circle.fill" size={16} color={colors.primary} />
              <Text
                style={[styles.locationLabel, { color: colors.tabIconDefault }]}
                numberOfLines={1}
              >
                {locationDisplayName}
              </Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.registerButton, { borderColor: colors.primary }]}
            onPress={handleRegisterPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.registerButtonText, { color: colors.primary }]}>
              Register as Mistry
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filter Chips */}
        <CategoryFilterChips
          selectedCategoryId={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </View>

      {/* Zone 2: Mistry List */}
      {isLoading && !isRefreshing ? (
        <WorkerListSkeleton count={4} />
      ) : workers.length > 0 ? (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.workerId}
          renderItem={renderWorkerCard}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      ) : (
        <View style={styles.emptyWrapper}>{renderEmptyState()}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 8,
    borderBottomWidth: 0,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  brandContainer: {
    flex: 1,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationLabel: {
    fontSize: 14,
  },
  registerButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  registerButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  listHeader: {
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    height: 12,
  },
  workerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  availabilityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  professionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  professionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
  },
  experienceText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  ctaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 24,
  },
  callButton: {},
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  whatsappButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyWrapper: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  enableButton: {
    marginTop: 24,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 24,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
