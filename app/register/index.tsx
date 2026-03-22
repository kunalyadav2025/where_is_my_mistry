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
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useCategories } from '@/hooks/use-categories';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterStep1Screen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { categories, isLoading: loadingCategories } = useCategories();

  const [name, setName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [experienceYears, setExperienceYears] = useState('');

  const handleNext = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Required', 'Please select your work category');
      return;
    }
    if (!experienceYears || parseInt(experienceYears) < 0) {
      Alert.alert('Required', 'Please enter your years of experience');
      return;
    }

    const category = categories.find((c) => c.categoryId === selectedCategory);

    router.push({
      pathname: '/register/location' as any,
      params: {
        name: name.trim(),
        categoryId: selectedCategory,
        categoryName: category?.name || '',
        experienceYears,
      },
    });
  };

  if (loadingCategories) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={20} color={colors.tint} />
          <Text style={[styles.backText, { color: colors.tint }]}>Back</Text>
        </TouchableOpacity>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepActive, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.tabIconDefault }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.tabIconDefault }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.tabIconDefault }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.tabIconDefault }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Register as a Mistry</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Step 1: Basic Information
        </Text>

        {/* Name Input */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Full Name *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="Enter your full name"
            placeholderTextColor={colors.tabIconDefault}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Work Category *</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.categoryId}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      selectedCategory === category.categoryId ? colors.tint : colors.card,
                    borderColor:
                      selectedCategory === category.categoryId ? colors.tint : colors.tabIconDefault,
                  },
                ]}
                onPress={() => setSelectedCategory(category.categoryId)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: selectedCategory === category.categoryId ? '#fff' : colors.text,
                    },
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>Years of Experience *</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.tabIconDefault }]}
            placeholder="e.g., 5"
            placeholderTextColor={colors.tabIconDefault}
            value={experienceYears}
            onChangeText={(text) => setExperienceYears(text.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: colors.tint }]}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next: Select Location</Text>
          <IconSymbol name="chevron.right" size={20} color="#fff" />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 16,
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
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  nextButton: {
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
