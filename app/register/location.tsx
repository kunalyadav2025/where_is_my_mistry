import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocations } from '@/hooks/use-locations';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface LocationItem {
  id: string;
  name: string;
}

export default function RegisterLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    categoryId: string;
    categoryName: string;
    experienceYears: string;
    mobile: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
    states,
    districts,
    tehsils,
    towns,
    isLoading,
    fetchStates,
    fetchDistricts,
    fetchTehsils,
    fetchTowns,
  } = useLocations();

  const [selectedState, setSelectedState] = useState<LocationItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationItem | null>(null);
  const [selectedTehsil, setSelectedTehsil] = useState<LocationItem | null>(null);
  const [selectedTown, setSelectedTown] = useState<LocationItem | null>(null);

  useEffect(() => {
    fetchStates();
  }, []);

  const handleStateSelect = (state: LocationItem) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedTehsil(null);
    setSelectedTown(null);
    fetchDistricts(state.id);
  };

  const handleDistrictSelect = (district: LocationItem) => {
    setSelectedDistrict(district);
    setSelectedTehsil(null);
    setSelectedTown(null);
    fetchTehsils(district.id);
  };

  const handleTehsilSelect = (tehsil: LocationItem) => {
    setSelectedTehsil(tehsil);
    setSelectedTown(null);
    fetchTowns(tehsil.id);
  };

  const handleTownSelect = (town: LocationItem) => {
    setSelectedTown(town);
  };

  const handleNext = () => {
    if (!selectedState || !selectedDistrict || !selectedTehsil || !selectedTown) {
      Alert.alert('Required', 'Please select all location fields');
      return;
    }

    router.push({
      pathname: '/register/details' as any,
      params: {
        ...params,
        stateId: selectedState.id,
        stateName: selectedState.name,
        districtId: selectedDistrict.id,
        districtName: selectedDistrict.name,
        tehsilId: selectedTehsil.id,
        tehsilName: selectedTehsil.name,
        townId: selectedTown.id,
        townName: selectedTown.name,
      },
    });
  };

  const renderLocationSection = (
    title: string,
    items: any[],
    selected: LocationItem | null,
    onSelect: (item: LocationItem) => void,
    idKey: string,
    disabled = false
  ) => (
    <View style={[styles.section, disabled && styles.sectionDisabled]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {isLoading && !items.length ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : items.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          {disabled ? `Select ${title.replace('Select ', '').toLowerCase()} first` : 'No options available'}
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {items.map((item) => {
              const id = item[idKey] || item.id;
              const isSelected = selected?.id === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                  onPress={() => onSelect({ id, name: item.name })}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <IconSymbol name="checkmark" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );

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
          <View style={[styles.stepDot, styles.stepActive, { backgroundColor: colors.tint }]} />
          <View style={[styles.stepLine, { backgroundColor: colors.tabIconDefault }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.tabIconDefault }]} />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Select Your Location</Text>
        <Text style={[styles.subtitle, { color: colors.tabIconDefault }]}>
          Step 2: Where do you work?
        </Text>

        {renderLocationSection(
          'Select State',
          states,
          selectedState,
          handleStateSelect,
          'stateId'
        )}

        {renderLocationSection(
          'Select District',
          districts,
          selectedDistrict,
          handleDistrictSelect,
          'districtId',
          !selectedState
        )}

        {renderLocationSection(
          'Select Tehsil',
          tehsils,
          selectedTehsil,
          handleTehsilSelect,
          'tehsilId',
          !selectedDistrict
        )}

        {renderLocationSection(
          'Select Town/Village',
          towns,
          selectedTown,
          handleTownSelect,
          'townId',
          !selectedTehsil
        )}

        {/* Selected Summary */}
        {selectedTown && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="location.fill" size={20} color={colors.tint} />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {selectedTown.name}, {selectedTehsil?.name}, {selectedDistrict?.name}, {selectedState?.name}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.tint },
            !selectedTown && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedTown}
        >
          <Text style={styles.nextButtonText}>Next: Final Details</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionDisabled: {
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingRight: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  loader: {
    paddingVertical: 16,
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
  },
  summaryText: {
    flex: 1,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
