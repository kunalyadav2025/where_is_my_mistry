import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories } from '@/hooks/use-categories';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

const CATEGORY_ICONS: Record<string, string> = {
  plumber: 'wrench.fill',
  electrician: 'bolt.fill',
  painter: 'paintbrush.fill',
  carpenter: 'hammer.fill',
  welder: 'flame.fill',
  'ac-repair': 'snowflake',
  'tv-repair': 'tv.fill',
  'washing-machine': 'washer.fill',
};

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { categories, isLoading, error, refetch } = useCategories();
  const { user, isAuthenticated, logout } = useAuth();

  const handleCategoryPress = (categoryId: string, categoryName: string) => {
    router.push({
      pathname: '/(tabs)/explore',
      params: { categoryId, categoryName },
    });
  };

  const handleLoginPress = () => {
    router.push('/(auth)/login' as any);
  };

  const handleRegisterPress = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login' as any);
    } else {
      router.push('/register' as any);
    }
  };

  const getIconName = (categoryId: string): string => {
    return CATEGORY_ICONS[categoryId] || 'questionmark.circle.fill';
  };

  if (isLoading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.tabIconDefault }]}>
          Loading categories...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.tabIconDefault }]}>
            {isAuthenticated ? `Hello, +91 ${user?.mobile}` : 'Welcome'}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>Find a Mistry</Text>
        </View>
        {isAuthenticated ? (
          <TouchableOpacity style={styles.profileButton} onPress={logout}>
            <IconSymbol name="person.circle.fill" size={32} color={colors.tint} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.loginButton, { backgroundColor: colors.tint }]}
            onPress={handleLoginPress}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: '#ef4444' }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryButton, { borderColor: colors.tint }]}
              onPress={refetch}
            >
              <Text style={[styles.retryText, { color: colors.tint }]}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
            <View style={styles.grid}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.categoryId}
                  style={[styles.categoryCard, { backgroundColor: colors.card }]}
                  onPress={() => handleCategoryPress(category.categoryId, category.name)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.tint + '20' }]}>
                    <IconSymbol
                      name={getIconName(category.categoryId) as any}
                      size={28}
                      color={colors.tint}
                    />
                  </View>
                  <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={1}>
                    {category.name}
                  </Text>
                  {category.nameHindi && (
                    <Text
                      style={[styles.categoryNameHindi, { color: colors.tabIconDefault }]}
                      numberOfLines={1}
                    >
                      {category.nameHindi}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Become a Mistry Banner */}
            <TouchableOpacity
              style={[styles.registerBanner, { backgroundColor: colors.tint }]}
              onPress={handleRegisterPress}
              activeOpacity={0.8}
            >
              <View style={styles.registerBannerContent}>
                <IconSymbol name="wrench.and.screwdriver.fill" size={32} color="#fff" />
                <View style={styles.registerBannerText}>
                  <Text style={styles.registerBannerTitle}>Are you a skilled worker?</Text>
                  <Text style={styles.registerBannerSubtitle}>
                    Register as a Mistry and get more customers
                  </Text>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 4,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  categoryNameHindi: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
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
  registerBanner: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  registerBannerText: {
    flex: 1,
  },
  registerBannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  registerBannerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
});