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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useLocalLocations, StateItem, DistrictItem, CityItem } from '@/hooks/use-local-locations';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function RegisterLocationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    name: string;
    categoryId: string;
    categoryName: string;
    experienceYears: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
    states,
    districts,
    cities,
    selectedStateId,
    selectedDistrictId,
    selectState,
    selectDistrict,
    getStateName,
    getDistrictName,
    isLoading,
  } = useLocalLocations();

  const [selectedState, setSelectedState] = useState<StateItem | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityItem | null>(null);
  const [pinCode, setPinCode] = useState('');

  const handleStateSelect = (state: StateItem) => {
    setSelectedState(state);
    setSelectedDistrict(null);
    setSelectedCity(null);
    setPinCode('');
    selectState(state.id);
  };

  const handleDistrictSelect = (district: DistrictItem) => {
    setSelectedDistrict(district);
    setSelectedCity(null);
    setPinCode('');
    selectDistrict(district.id);
  };

  const handleCitySelect = (city: CityItem) => {
    setSelectedCity(city);
    // Auto-fill pincode from selected city
    setPinCode(city.pincode);
  };

  const validatePinCode = (pin: string) => /^\d{6}$/.test(pin);

  const handleNext = () => {
    if (!selectedState || !selectedDistrict || !selectedCity) {
      Alert.alert('Required', 'Please select State, District and City');
      return;
    }

    if (!validatePinCode(pinCode)) {
      Alert.alert('Invalid PIN', 'Please enter a valid 6-digit PIN code');
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
        // Using city as town for compatibility
        tehsilId: selectedDistrict.id,
        tehsilName: selectedDistrict.name,
        townId: selectedCity.id,
        townName: selectedCity.name,
        pinCode,
      },
    });
  };

  const renderStateSection = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Select State *</Text>
      {states.length === 0 ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {states.map((state) => {
              const isSelected = selectedState?.id === state.id;
              return (
                <TouchableOpacity
                  key={state.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                  onPress={() => handleStateSelect(state)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {state.name}
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

  const renderDistrictSection = () => (
    <View style={[styles.section, !selectedState && styles.sectionDisabled]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Select District *</Text>
      {!selectedState ? (
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          Select state first
        </Text>
      ) : isLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : districts.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          No districts available
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {districts.map((district) => {
              const isSelected = selectedDistrict?.id === district.id;
              return (
                <TouchableOpacity
                  key={district.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                  onPress={() => handleDistrictSelect(district)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {district.name}
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

  const renderCitySection = () => (
    <View style={[styles.section, !selectedDistrict && styles.sectionDisabled]}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Select City/Town *</Text>
      {!selectedDistrict ? (
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          Select district first
        </Text>
      ) : isLoading ? (
        <ActivityIndicator size="small" color={colors.tint} style={styles.loader} />
      ) : cities.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.tabIconDefault }]}>
          No cities available
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
          <View style={styles.chipContainer}>
            {cities.map((city) => {
              const isSelected = selectedCity?.id === city.id;
              return (
                <TouchableOpacity
                  key={city.id}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.tint : colors.card,
                      borderColor: isSelected ? colors.tint : colors.tabIconDefault,
                    },
                  ]}
                  onPress={() => handleCitySelect(city)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? '#fff' : colors.text },
                    ]}
                  >
                    {city.name}
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

        {renderStateSection()}
        {renderDistrictSection()}
        {renderCitySection()}

        {/* PIN Code Input */}
        <View style={[styles.section, !selectedCity && styles.sectionDisabled]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>PIN Code *</Text>
          <TextInput
            style={[
              styles.pinInput,
              {
                color: colors.text,
                borderColor: colors.tabIconDefault,
                backgroundColor: colors.card,
              },
            ]}
            placeholder="Enter 6-digit PIN code"
            placeholderTextColor={colors.tabIconDefault}
            value={pinCode}
            onChangeText={(text) => setPinCode(text.replace(/\D/g, '').substring(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            editable={!!selectedCity}
          />
          {selectedCity && (
            <Text style={[styles.pinHint, { color: colors.tabIconDefault }]}>
              Auto-filled from selected city. You can change if needed.
            </Text>
          )}
        </View>

        {/* Selected Summary */}
        {selectedCity && validatePinCode(pinCode) && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <IconSymbol name="location.fill" size={20} color={colors.tint} />
            <Text style={[styles.summaryText, { color: colors.text }]}>
              {selectedCity.name}, {selectedDistrict?.name}, {selectedState?.name} - {pinCode}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: colors.card }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: colors.tint },
            (!selectedCity || !validatePinCode(pinCode)) && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!selectedCity || !validatePinCode(pinCode)}
        >
          <Text style={styles.nextButtonText}>Next: Verify Mobile</Text>
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
    flexWrap: 'wrap',
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
  pinInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  pinHint: {
    fontSize: 12,
    marginTop: 6,
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
