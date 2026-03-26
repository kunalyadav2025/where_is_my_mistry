import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLocalLocations } from '../use-local-locations';
import locationData from '@/data/india-locations.json';

describe('useLocalLocations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with states from JSON data', () => {
      const { result } = renderHook(() => useLocalLocations());

      expect(result.current.states.length).toBeGreaterThan(0);
      expect(result.current.states[0]).toHaveProperty('id');
      expect(result.current.states[0]).toHaveProperty('name');
      expect(result.current.isLoading).toBe(false);
    });

    it('should have empty districts initially', () => {
      const { result } = renderHook(() => useLocalLocations());

      expect(result.current.districts).toEqual([]);
    });

    it('should have empty cities initially', () => {
      const { result } = renderHook(() => useLocalLocations());

      expect(result.current.cities).toEqual([]);
    });

    it('should have no state selected initially', () => {
      const { result } = renderHook(() => useLocalLocations());

      expect(result.current.selectedStateId).toBeNull();
      expect(result.current.selectedDistrictId).toBeNull();
    });

    it('should sort states alphabetically by name', () => {
      const { result } = renderHook(() => useLocalLocations());

      const stateNames = result.current.states.map(s => s.name);
      const sortedNames = [...stateNames].sort((a, b) => a.localeCompare(b));

      expect(stateNames).toEqual(sortedNames);
    });
  });

  describe('ID Generation', () => {
    it('should generate lowercase IDs from state names', () => {
      const { result } = renderHook(() => useLocalLocations());

      const state = result.current.states.find(s => s.name);
      expect(state?.id).toBe(state?.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    });

    it('should handle state names with special characters', () => {
      const { result } = renderHook(() => useLocalLocations());

      // Find a state like "Andaman And nicobar islands"
      const specialState = result.current.states.find(s =>
        s.name.toLowerCase().includes('andaman')
      );

      if (specialState) {
        expect(specialState.id).toMatch(/^[a-z0-9-]+$/);
        expect(specialState.id).not.toContain(' ');
      }
    });

    it('should remove extra spaces in ID generation', () => {
      const { result } = renderHook(() => useLocalLocations());

      // All IDs should not have consecutive hyphens
      result.current.states.forEach(state => {
        expect(state.id).not.toMatch(/--/);
      });
    });
  });

  describe('State Selection', () => {
    it('should update selectedStateId when state is selected', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.selectedStateId).toBe(firstStateId);
      });
    });

    it('should load districts for selected state', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });
    });

    it('should reset district selection when state changes', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;
      const secondStateId = result.current.states[1]?.id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.selectedDistrictId).toBe(firstDistrictId);
      });

      // Change state
      if (secondStateId) {
        act(() => {
          result.current.selectState(secondStateId);
        });

        await waitFor(() => {
          expect(result.current.selectedDistrictId).toBeNull();
        });
      }
    });

    it('should set loading state during state selection', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      // Loading should be set immediately
      expect(result.current.isLoading).toBe(true);

      // Wait for loading to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 200 });
    });

    it('should sort districts alphabetically', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const districtNames = result.current.districts.map(d => d.name);
      const sortedNames = [...districtNames].sort((a, b) => a.localeCompare(b));

      expect(districtNames).toEqual(sortedNames);
    });
  });

  describe('District Selection', () => {
    it('should update selectedDistrictId when district is selected', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.selectedDistrictId).toBe(firstDistrictId);
      });
    });

    it('should load cities for selected district', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });
    });

    it('should set loading state during district selection', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      }, { timeout: 200 });
    });

    it('should sort cities alphabetically', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      const cityNames = result.current.cities.map(c => c.name);
      const sortedNames = [...cityNames].sort((a, b) => a.localeCompare(b));

      expect(cityNames).toEqual(sortedNames);
    });
  });

  describe('City Data', () => {
    it('should include pincode with each city', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      const city = result.current.cities[0];
      expect(city).toHaveProperty('pincode');
      expect(typeof city.pincode).toBe('string');
      expect(city.pincode).toMatch(/^\d+$/);
    });

    it('should have correct city structure', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      const city = result.current.cities[0];
      expect(city).toHaveProperty('id');
      expect(city).toHaveProperty('name');
      expect(city).toHaveProperty('districtId');
      expect(city).toHaveProperty('pincode');
      expect(city.districtId).toBe(firstDistrictId);
    });

    it('should convert numeric pincodes to strings', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      // All pincodes should be strings
      result.current.cities.forEach(city => {
        expect(typeof city.pincode).toBe('string');
      });
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all selections', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.selectedDistrictId).toBe(firstDistrictId);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedStateId).toBeNull();
      expect(result.current.selectedDistrictId).toBeNull();
    });

    it('should clear districts when reset', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.districts).toEqual([]);
      expect(result.current.cities).toEqual([]);
    });
  });

  describe('Helper Functions', () => {
    it('should get state name by ID', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstState = result.current.states[0];
      const stateName = result.current.getStateName(firstState.id);

      expect(stateName).toBe(firstState.name);
    });

    it('should return empty string for invalid state ID', () => {
      const { result } = renderHook(() => useLocalLocations());

      const stateName = result.current.getStateName('invalid-state-id');

      expect(stateName).toBe('');
    });

    it('should get district name by ID', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrict = result.current.districts[0];
      const districtName = result.current.getDistrictName(firstDistrict.id);

      expect(districtName).toBe(firstDistrict.name);
    });

    it('should return empty string for invalid district ID', () => {
      const { result } = renderHook(() => useLocalLocations());

      const districtName = result.current.getDistrictName('invalid-district-id');

      expect(districtName).toBe('');
    });

    it('should get city by ID', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      const firstCity = result.current.cities[0];
      const city = result.current.getCity(firstCity.id);

      expect(city).toEqual(firstCity);
    });

    it('should return undefined for invalid city ID', () => {
      const { result } = renderHook(() => useLocalLocations());

      const city = result.current.getCity('invalid-city-id');

      expect(city).toBeUndefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle selecting non-existent state gracefully', async () => {
      const { result } = renderHook(() => useLocalLocations());

      act(() => {
        result.current.selectState('non-existent-state');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.districts).toEqual([]);
      expect(result.current.cities).toEqual([]);
    });

    it('should handle selecting non-existent district gracefully', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      act(() => {
        result.current.selectDistrict('non-existent-district');
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.cities).toEqual([]);
    });

    it('should return empty arrays when no state is selected', () => {
      const { result } = renderHook(() => useLocalLocations());

      expect(result.current.districts).toEqual([]);
      expect(result.current.cities).toEqual([]);
    });

    it('should return empty cities when no district is selected', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      // Don't select district
      expect(result.current.cities).toEqual([]);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain stateId reference in districts', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      result.current.districts.forEach(district => {
        expect(district.stateId).toBe(firstStateId);
      });
    });

    it('should maintain districtId reference in cities', async () => {
      const { result } = renderHook(() => useLocalLocations());

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      const firstDistrictId = result.current.districts[0].id;

      act(() => {
        result.current.selectDistrict(firstDistrictId);
      });

      await waitFor(() => {
        expect(result.current.cities.length).toBeGreaterThan(0);
      });

      result.current.cities.forEach(city => {
        expect(city.districtId).toBe(firstDistrictId);
      });
    });

    it('should trim whitespace from names', async () => {
      const { result } = renderHook(() => useLocalLocations());

      result.current.states.forEach(state => {
        expect(state.name).toBe(state.name.trim());
      });

      const firstStateId = result.current.states[0].id;

      act(() => {
        result.current.selectState(firstStateId);
      });

      await waitFor(() => {
        expect(result.current.districts.length).toBeGreaterThan(0);
      });

      result.current.districts.forEach(district => {
        expect(district.name).toBe(district.name.trim());
      });
    });
  });
});
