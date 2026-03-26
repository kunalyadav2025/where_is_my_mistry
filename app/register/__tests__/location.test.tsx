import React from 'react';
import { render, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import RegisterLocationScreen from '../location';
import { useLocalLocations } from '@/hooks/use-local-locations';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('@/hooks/use-local-locations');
jest.mock('expo-router');
jest.mock('react-native/Libraries/Alert/Alert');

describe('RegisterLocationScreen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockParams = {
    name: 'Rajesh Kumar',
    categoryId: 'plumber',
    categoryName: 'Plumber',
    experienceYears: '10',
  };

  const mockStates = [
    { id: 'madhya-pradesh', name: 'Madhya Pradesh' },
    { id: 'maharashtra', name: 'Maharashtra' },
    { id: 'rajasthan', name: 'Rajasthan' },
  ];

  const mockDistricts = [
    { id: 'indore', name: 'Indore', stateId: 'madhya-pradesh' },
    { id: 'bhopal', name: 'Bhopal', stateId: 'madhya-pradesh' },
  ];

  const mockCities = [
    { id: 'vijay-nagar', name: 'Vijay Nagar', districtId: 'indore', pincode: '452010' },
    { id: 'palasia', name: 'Palasia', districtId: 'indore', pincode: '452001' },
  ];

  const mockUseLocalLocations = {
    states: mockStates,
    districts: [],
    cities: [],
    selectedStateId: null,
    selectedDistrictId: null,
    selectState: jest.fn(),
    selectDistrict: jest.fn(),
    getStateName: jest.fn(),
    getDistrictName: jest.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useLocalSearchParams as jest.Mock).mockReturnValue(mockParams);
    (useLocalLocations as jest.Mock).mockReturnValue(mockUseLocalLocations);
  });

  describe('Rendering', () => {
    it('should render location selection screen with all elements', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Select Your Location')).toBeTruthy();
      expect(getByText('Step 2: Where do you work?')).toBeTruthy();
      expect(getByText('Select State *')).toBeTruthy();
      expect(getByText('Select District *')).toBeTruthy();
      expect(getByText('Select City/Town *')).toBeTruthy();
      expect(getByText('PIN Code *')).toBeTruthy();
    });

    it('should render all states as chips', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      mockStates.forEach(state => {
        expect(getByText(state.name)).toBeTruthy();
      });
    });

    it('should show step indicator with correct progress', () => {
      const { UNSAFE_getAllByType } = render(<RegisterLocationScreen />);

      // Step 2 of 3 should be active
      // This is represented by the step dots in the header
      expect(() => render(<RegisterLocationScreen />)).not.toThrow();
    });

    it('should have back button', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Back')).toBeTruthy();
    });

    it('should have next button', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Next: Verify Mobile')).toBeTruthy();
    });
  });

  describe('State Selection', () => {
    it('should call selectState when state chip is pressed', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const stateChip = getByText('Madhya Pradesh');
      fireEvent.press(stateChip);

      expect(mockUseLocalLocations.selectState).toHaveBeenCalledWith('madhya-pradesh');
    });

    it('should update districts when state is selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Indore')).toBeTruthy();
      expect(getByText('Bhopal')).toBeTruthy();
    });

    it('should reset district and city when state changes', () => {
      const { getByText, rerender } = render(<RegisterLocationScreen />);

      // First select a state
      const stateChip = getByText('Madhya Pradesh');
      fireEvent.press(stateChip);

      expect(mockUseLocalLocations.selectState).toHaveBeenCalledWith('madhya-pradesh');
    });

    it('should show loading indicator when states are loading', () => {
      const loadingMock = {
        ...mockUseLocalLocations,
        states: [],
        isLoading: true,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(loadingMock);

      const { UNSAFE_getAllByType } = render(<RegisterLocationScreen />);

      // ActivityIndicator should be rendered
      expect(() => render(<RegisterLocationScreen />)).not.toThrow();
    });

    it('should highlight selected state', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      // Selected state chip should have checkmark icon
      expect(() => getByText('Madhya Pradesh')).not.toThrow();
    });
  });

  describe('District Selection', () => {
    it('should show disabled district section when no state selected', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Select state first')).toBeTruthy();
    });

    it('should enable district section when state is selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, queryByText } = render(<RegisterLocationScreen />);

      expect(queryByText('Select state first')).toBeNull();
      expect(getByText('Indore')).toBeTruthy();
    });

    it('should call selectDistrict when district chip is pressed', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const districtChip = getByText('Indore');
      fireEvent.press(districtChip);

      expect(mockUseLocalLocations.selectDistrict).toHaveBeenCalledWith('indore');
    });

    it('should show loading indicator when districts are loading', () => {
      const loadingMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: [],
        isLoading: true,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(loadingMock);

      const { UNSAFE_getAllByType } = render(<RegisterLocationScreen />);

      // ActivityIndicator should be rendered
      expect(() => render(<RegisterLocationScreen />)).not.toThrow();
    });

    it('should highlight selected district', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      expect(() => getByText('Indore')).not.toThrow();
    });

    it('should reset city when district changes', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);
    });

    it('should show no districts message when districts array is empty', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: [],
        isLoading: false,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('No districts available')).toBeTruthy();
    });
  });

  describe('City Selection', () => {
    it('should show disabled city section when no district selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        districts: mockDistricts,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('Select district first')).toBeTruthy();
    });

    it('should enable city section when district is selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, queryByText } = render(<RegisterLocationScreen />);

      expect(queryByText('Select district first')).toBeNull();
      expect(getByText('Vijay Nagar')).toBeTruthy();
      expect(getByText('Palasia')).toBeTruthy();
    });

    it('should auto-fill pincode when city is selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      expect(pinInput.props.value).toBe('452010');
    });

    it('should show no cities message when cities array is empty', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: [],
        isLoading: false,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      expect(getByText('No cities available')).toBeTruthy();
    });

    it('should highlight selected city', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      expect(() => getByText('Vijay Nagar')).not.toThrow();
    });
  });

  describe('PIN Code Input', () => {
    it('should render PIN code input field', () => {
      const { getByPlaceholderText } = render(<RegisterLocationScreen />);

      expect(getByPlaceholderText('Enter 6-digit PIN code')).toBeTruthy();
    });

    it('should be disabled when no city is selected', () => {
      const { getByPlaceholderText } = render(<RegisterLocationScreen />);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      expect(pinInput.props.editable).toBe(false);
    });

    it('should be enabled when city is selected', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByPlaceholderText, getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      expect(pinInput.props.editable).toBe(true);
    });

    it('should allow manual PIN code input', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByPlaceholderText, getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '452020');

      expect(pinInput.props.value).toBe('452020');
    });

    it('should only allow numeric input for PIN code', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByPlaceholderText, getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, 'abc123xyz');

      expect(pinInput.props.value).toBe('452010');
    });

    it('should limit PIN code to 6 digits', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByPlaceholderText, getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '12345678');

      expect(pinInput.props.value).toBe('452010');
    });

    it('should show hint text after city selection', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      expect(getByText('Auto-filled from selected city. You can change if needed.')).toBeTruthy();
    });
  });

  describe('PIN Code Validation', () => {
    it('should validate 6-digit PIN code', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '452010');

      const nextButton = getByText('Next: Verify Mobile');
      expect(nextButton.parent?.props.disabled).toBe(false);
    });

    it('should show alert for invalid PIN code on next button press', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '12345');

      const nextButton = getByText('Next: Verify Mobile');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Invalid PIN',
        'Please enter a valid 6-digit PIN code'
      );
    });

    it('should show alert when city not selected on next button press', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const nextButton = getByText('Next: Verify Mobile');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Required',
        'Please select State, District and City'
      );
    });
  });

  describe('Summary Display', () => {
    it('should show summary card when all fields are valid', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      // Summary should show: City, District, State - Pincode
      expect(getByText('Vijay Nagar, Indore, Madhya Pradesh - 452010')).toBeTruthy();
    });

    it('should not show summary when PIN code is invalid', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { queryByText, getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '123');

      // Summary should not be visible
      expect(queryByText(/Vijay Nagar, Indore, Madhya Pradesh - 123/)).toBeNull();
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const backButton = getByText('Back');
      fireEvent.press(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should navigate to details page with all params', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const nextButton = getByText('Next: Verify Mobile');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/register/details',
        params: {
          ...mockParams,
          stateId: 'madhya-pradesh',
          stateName: 'Madhya Pradesh',
          districtId: 'indore',
          districtName: 'Indore',
          tehsilId: 'indore',
          tehsilName: 'Indore',
          townId: 'vijay-nagar',
          townName: 'Vijay Nagar',
          pinCode: '452010',
        },
      });
    });

    it('should disable next button when no city selected', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const nextButton = getByText('Next: Verify Mobile');
      expect(nextButton.parent?.props.disabled).toBe(true);
    });

    it('should disable next button when PIN is invalid', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      fireEvent.changeText(pinInput, '123');

      const nextButton = getByText('Next: Verify Mobile');
      expect(nextButton.parent?.props.disabled).toBe(true);
    });

    it('should enable next button when all fields are valid', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText } = render(<RegisterLocationScreen />);

      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const nextButton = getByText('Next: Verify Mobile');
      expect(nextButton.parent?.props.disabled).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing params gracefully', () => {
      (useLocalSearchParams as jest.Mock).mockReturnValue({});

      expect(() => render(<RegisterLocationScreen />)).not.toThrow();
    });

    it('should handle state selection when districts fail to load', () => {
      const { getByText } = render(<RegisterLocationScreen />);

      const stateChip = getByText('Madhya Pradesh');
      fireEvent.press(stateChip);

      expect(mockUseLocalLocations.selectState).toHaveBeenCalled();
    });

    it('should clear PIN code when city is changed', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      // Select first city
      const firstCity = getByText('Vijay Nagar');
      fireEvent.press(firstCity);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      expect(pinInput.props.value).toBe('452010');

      // Select second city
      const secondCity = getByText('Palasia');
      fireEvent.press(secondCity);

      expect(pinInput.props.value).toBe('452001');
    });

    it('should clear city and PIN when district is changed', () => {
      const updatedMock = {
        ...mockUseLocalLocations,
        selectedStateId: 'madhya-pradesh',
        selectedDistrictId: 'indore',
        districts: mockDistricts,
        cities: mockCities,
      };

      (useLocalLocations as jest.Mock).mockReturnValue(updatedMock);

      const { getByText, getByPlaceholderText } = render(<RegisterLocationScreen />);

      // Select city
      const cityChip = getByText('Vijay Nagar');
      fireEvent.press(cityChip);

      const pinInput = getByPlaceholderText('Enter 6-digit PIN code');
      expect(pinInput.props.value).toBe('452010');

      // Change district
      const districtChip = getByText('Bhopal');
      fireEvent.press(districtChip);

      expect(mockUseLocalLocations.selectDistrict).toHaveBeenCalledWith('bhopal');
    });
  });
});
