import React from 'react';
import { StyleSheet, Text, ScrollView, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface CategoryChip {
  id: string;
  name: string;
  nameHindi?: string;
  icon: string;
}

const CATEGORY_CHIPS: CategoryChip[] = [
  { id: 'all', name: 'All', nameHindi: 'सभी', icon: 'square.grid.2x2.fill' },
  { id: 'plumber', name: 'Plumber', nameHindi: 'प्लंबर', icon: 'wrench.fill' },
  { id: 'electrician', name: 'Electrician', nameHindi: 'इलेक्ट्रीशियन', icon: 'bolt.fill' },
  { id: 'painter', name: 'Painter', nameHindi: 'पेंटर', icon: 'paintbrush.fill' },
  { id: 'raj-mistry', name: 'Raj Mistry', nameHindi: 'राज मिस्त्री', icon: 'building.2.fill' },
  { id: 'carpenter', name: 'Carpenter', nameHindi: 'बढ़ई', icon: 'hammer.fill' },
  { id: 'welder', name: 'Welder', nameHindi: 'वेल्डर', icon: 'flame.fill' },
  { id: 'ac-repair', name: 'AC Repair', nameHindi: 'AC मरम्मत', icon: 'snowflake' },
  { id: 'washing-machine', name: 'Washing Machine', nameHindi: 'वाशिंग मशीन', icon: 'washer.fill' },
  { id: 'cycle-repair', name: 'Cycle Repair', nameHindi: 'साइकिल मरम्मत', icon: 'bicycle' },
  { id: 'bike-service', name: 'Bike Service', nameHindi: 'बाइक सर्विस', icon: 'motorcycle.fill' },
];

interface CategoryFilterChipsProps {
  selectedCategoryId: string;
  onCategorySelect: (categoryId: string) => void;
}

export function CategoryFilterChips({
  selectedCategoryId,
  onCategorySelect,
}: CategoryFilterChipsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = chip.id === selectedCategoryId;

          return (
            <TouchableOpacity
              key={chip.id}
              style={[
                styles.chip,
                {
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
              ]}
              onPress={() => onCategorySelect(chip.id)}
              activeOpacity={0.7}
            >
              <IconSymbol
                name={chip.icon as any}
                size={16}
                color={isSelected ? '#FFFFFF' : colors.tabIconDefault}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                  },
                ]}
              >
                {chip.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

// Export category chips for use elsewhere
export { CATEGORY_CHIPS };

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
