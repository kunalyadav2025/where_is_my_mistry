import { useState, useEffect, useCallback, useMemo } from 'react';
import locationData from '@/data/india-locations.json';

interface Location {
  location: string;
  pincode: number;
}

interface District {
  district: string;
  locations: Location[];
}

interface State {
  state: string;
  districts: District[];
}

interface LocationData {
  country: string;
  states: State[];
}

export interface StateItem {
  id: string;
  name: string;
}

export interface DistrictItem {
  id: string;
  name: string;
  stateId: string;
}

export interface CityItem {
  id: string;
  name: string;
  districtId: string;
  pincode: string;
}

// Generate unique ID from name
const generateId = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

export function useLocalLocations() {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Parse and memoize the location data
  const data = useMemo(() => locationData as LocationData, []);

  // Get all states
  const states = useMemo<StateItem[]>(() => {
    return data.states.map((s) => ({
      id: generateId(s.state),
      name: s.state.trim(),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  // Get districts for selected state
  const districts = useMemo<DistrictItem[]>(() => {
    if (!selectedStateId) return [];

    const state = data.states.find((s) => generateId(s.state) === selectedStateId);
    if (!state) return [];

    return state.districts.map((d) => ({
      id: generateId(d.district),
      name: d.district.trim(),
      stateId: selectedStateId,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data, selectedStateId]);

  // Get cities/locations for selected district
  const cities = useMemo<CityItem[]>(() => {
    if (!selectedStateId || !selectedDistrictId) return [];

    const state = data.states.find((s) => generateId(s.state) === selectedStateId);
    if (!state) return [];

    const district = state.districts.find((d) => generateId(d.district) === selectedDistrictId);
    if (!district) return [];

    return district.locations.map((l) => ({
      id: generateId(l.location),
      name: l.location.trim(),
      districtId: selectedDistrictId,
      pincode: l.pincode.toString(),
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data, selectedStateId, selectedDistrictId]);

  // Select state and reset dependent selections
  const selectState = useCallback((stateId: string) => {
    setIsLoading(true);
    setSelectedStateId(stateId);
    setSelectedDistrictId(null);
    // Simulate brief loading for smooth UX
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  // Select district and reset dependent selections
  const selectDistrict = useCallback((districtId: string) => {
    setIsLoading(true);
    setSelectedDistrictId(districtId);
    setTimeout(() => setIsLoading(false), 100);
  }, []);

  // Reset all selections
  const reset = useCallback(() => {
    setSelectedStateId(null);
    setSelectedDistrictId(null);
  }, []);

  // Get state name by ID
  const getStateName = useCallback((stateId: string): string => {
    const state = states.find((s) => s.id === stateId);
    return state?.name || '';
  }, [states]);

  // Get district name by ID
  const getDistrictName = useCallback((districtId: string): string => {
    const district = districts.find((d) => d.id === districtId);
    return district?.name || '';
  }, [districts]);

  // Get city by ID
  const getCity = useCallback((cityId: string): CityItem | undefined => {
    return cities.find((c) => c.id === cityId);
  }, [cities]);

  return {
    // Data
    states,
    districts,
    cities,

    // Selection state
    selectedStateId,
    selectedDistrictId,

    // Actions
    selectState,
    selectDistrict,
    reset,

    // Helpers
    getStateName,
    getDistrictName,
    getCity,

    // Loading state
    isLoading,
  };
}
