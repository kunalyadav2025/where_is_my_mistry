import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function WorkerCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <Skeleton width={56} height={56} borderRadius={28} />
        <View style={styles.cardInfo}>
          <Skeleton width={140} height={18} borderRadius={4} />
          <View style={styles.cardInfoRow}>
            <Skeleton width={80} height={14} borderRadius={4} />
          </View>
          <Skeleton width={100} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={100} height={36} borderRadius={18} />
        <Skeleton width={100} height={36} borderRadius={18} />
      </View>
    </View>
  );
}

export function WorkerListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      <Skeleton width={150} height={18} borderRadius={4} style={{ marginBottom: 12 }} />
      {Array.from({ length: count }).map((_, index) => (
        <WorkerCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  listContainer: {
    padding: 16,
  },
});
