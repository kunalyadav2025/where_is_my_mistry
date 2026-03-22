import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useWorkers } from '@/hooks/use-workers';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Worker } from '@/shared/types';

export default function ExploreScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const { workers, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useWorkers({
    categoryId: params.categoryId,
  });

  const handleWorkerPress = (workerId: string) => {
    router.push({
      pathname: '/worker/[id]' as any,
      params: { id: workerId },
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <IconSymbol key={i} name="star.fill" size={14} color="#f59e0b" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <IconSymbol key={i} name="star.leadinghalf.filled" size={14} color="#f59e0b" />
        );
      } else {
        stars.push(
          <IconSymbol key={i} name="star" size={14} color="#d1d5db" />
        );
      }
    }
    return stars;
  };

  const renderWorkerCard = ({ item: worker }: { item: Worker }) => (
    <TouchableOpacity
      style={[styles.workerCard, { backgroundColor: colors.card }]}
      onPress={() => handleWorkerPress(worker.workerId)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {worker.profilePhotoUrl ? (
          <Image source={{ uri: worker.profilePhotoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.tint + '30' }]}>
            <IconSymbol name="person.fill" size={24} color={colors.tint} />
          </View>
        )}
        {worker.isAvailable && (
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
          </View>
        )}
      </View>

      <View style={styles.workerInfo}>
        <Text style={[styles.workerName, { color: colors.text }]}>{worker.name}</Text>
        <Text style={[styles.workerCategory, { color: colors.tabIconDefault }]}>
          {worker.categoryName}
        </Text>
        <View style={styles.locationRow}>
          <IconSymbol name="location.fill" size={12} color={colors.tabIconDefault} />
          <Text style={[styles.locationText, { color: colors.tabIconDefault }]}>
            {worker.townName}, {worker.districtName}
          </Text>
        </View>
        <View style={styles.ratingRow}>
          <View style={styles.stars}>{renderStars(worker.avgRating)}</View>
          <Text style={[styles.ratingText, { color: colors.tabIconDefault }]}>
            {worker.avgRating.toFixed(1)} ({worker.reviewCount})
          </Text>
        </View>
      </View>

      <View style={styles.experienceContainer}>
        <Text style={[styles.experienceYears, { color: colors.tint }]}>
          {worker.experienceYears}
        </Text>
        <Text style={[styles.experienceLabel, { color: colors.tabIconDefault }]}>yrs exp</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => {
    if (isLoading) return null;

    if (!params.categoryId) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol name="magnifyingglass" size={48} color={colors.tabIconDefault} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Select a Category</Text>
          <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
            Go to Home and select a category to find workers
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <IconSymbol name="person.3" size={48} color={colors.tabIconDefault} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Workers Found</Text>
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          No {params.categoryName || 'workers'} available in your area yet
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
          Finding workers...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {params.categoryId && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={20} color={colors.tint} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: colors.text }]}>
          {params.categoryName || 'Browse Workers'}
        </Text>
        <View style={styles.headerRight}>
          {workers.length > 0 && (
            <Text style={[styles.resultCount, { color: colors.tabIconDefault }]}>
              {workers.length} found
            </Text>
          )}
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: colors.tint }]}
            onPress={refresh}
          >
            <Text style={[styles.retryText, { color: colors.tint }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workers}
          keyExtractor={(item) => item.workerId}
          renderItem={renderWorkerCard}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={isLoading}
          onRefresh={refresh}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    marginLeft: 8,
  },
  resultCount: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  workerCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22c55e',
  },
  workerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  workerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  workerCategory: {
    fontSize: 13,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
  },
  experienceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  experienceYears: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  experienceLabel: {
    fontSize: 10,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});
