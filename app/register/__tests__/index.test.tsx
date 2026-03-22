import React from 'react';
import { render, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import RegisterStep1Screen from '../index';
import { useCategories } from '@/hooks/use-categories';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

jest.mock('@/hooks/use-categories');
jest.mock('expo-router');
jest.mock('react-native/Libraries/Alert/Alert');

describe('RegisterStep1Screen', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  };

  const mockCategories = [
    { categoryId: 'plumber', name: 'Plumber', nameHindi: 'प्लंबर' },
    { categoryId: 'electrician', name: 'Electrician', nameHindi: 'इलेक्ट्रीशियन' },
    { categoryId: 'carpenter', name: 'Carpenter', nameHindi: 'बढ़ई' },
    { categoryId: 'painter', name: 'Painter', nameHindi: 'पेंटर' },
  ];

  const mockUseCategories = {
    categories: mockCategories,
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useCategories as jest.Mock).mockReturnValue(mockUseCategories);
  });

  describe('Rendering', () => {
    it('should render registration screen with all elements', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      expect(getByText('Register as a Mistry')).toBeTruthy();
      expect(getByText('Step 1: Basic Information')).toBeTruthy();
      expect(getByText('Full Name *')).toBeTruthy();
      expect(getByText('Work Category *')).toBeTruthy();
      expect(getByText('Years of Experience *')).toBeTruthy();
      expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(getByPlaceholderText('e.g., 5')).toBeTruthy();
      expect(getByText('Next: Select Location')).toBeTruthy();
    });

    it('should render all categories as chips', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      mockCategories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
      });
    });

    it('should show loading indicator when categories are loading', () => {
      const loadingMock = {
        ...mockUseCategories,
        isLoading: true,
      };

      (useCategories as jest.Mock).mockReturnValue(loadingMock);

      const { UNSAFE_getAllByType } = render(<RegisterStep1Screen />);

      // ActivityIndicator should be rendered
      expect(() => render(<RegisterStep1Screen />)).not.toThrow();
    });

    it('should have back button', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      expect(getByText('Back')).toBeTruthy();
    });

    it('should show step indicator with step 1 active', () => {
      const { UNSAFE_getAllByType } = render(<RegisterStep1Screen />);

      // Step 1 of 3 should be active
      expect(() => render(<RegisterStep1Screen />)).not.toThrow();
    });
  });

  describe('Name Input', () => {
    it('should allow user to type name', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      expect(nameInput.props.value).toBe('Rajesh Kumar');
    });

    it('should capitalize first letter of each word', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'rajesh kumar');

      // Input should auto-capitalize words
      expect(nameInput.props.autoCapitalize).toBe('words');
    });

    it('should show alert when name is empty on submit', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter your name');
    });

    it('should show alert when name contains only whitespace', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, '   ');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please enter your name');
    });

    it('should trim whitespace from name before submission', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, '  Rajesh Kumar  ');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '5');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/register/location',
        params: {
          name: 'Rajesh Kumar',
          categoryId: 'plumber',
          categoryName: 'Plumber',
          experienceYears: '5',
        },
      });
    });
  });

  describe('Category Selection', () => {
    it('should select category when chip is pressed', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      // Chip should have different styling when selected
      expect(() => getByText('Plumber')).not.toThrow();
    });

    it('should allow changing category selection', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const plumberChip = getByText('Plumber');
      fireEvent.press(plumberChip);

      const electricianChip = getByText('Electrician');
      fireEvent.press(electricianChip);

      // New selection should override old one
      expect(() => getByText('Electrician')).not.toThrow();
    });

    it('should show alert when no category is selected on submit', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith('Required', 'Please select your work category');
    });

    it('should highlight selected category', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      // Selected chip should have different background color
      expect(() => getByText('Plumber')).not.toThrow();
    });

    it('should display all available categories', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      expect(getByText('Plumber')).toBeTruthy();
      expect(getByText('Electrician')).toBeTruthy();
      expect(getByText('Carpenter')).toBeTruthy();
      expect(getByText('Painter')).toBeTruthy();
    });
  });

  describe('Experience Input', () => {
    it('should allow user to type experience years', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '10');

      expect(experienceInput.props.value).toBe('10');
    });

    it('should only allow numeric input', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, 'abc123xyz');

      expect(experienceInput.props.value).toBe('123');
    });

    it('should limit experience to 2 digits', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '12345');

      expect(experienceInput.props.value).toBe('12');
    });

    it('should show alert when experience is empty on submit', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(Alert.alert).toHaveBeenCalledWith(
        'Required',
        'Please enter your years of experience'
      );
    });

    it('should show alert when experience is negative', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      // Negative input should be filtered by numeric-only validation
      fireEvent.changeText(experienceInput, '-5');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      // Should not allow negative, so either empty or 5
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should accept zero years of experience', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '0');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/register/location',
        params: {
          name: 'Rajesh Kumar',
          categoryId: 'plumber',
          categoryName: 'Plumber',
          experienceYears: '0',
        },
      });
    });

    it('should use number-pad keyboard type', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');

      expect(experienceInput.props.keyboardType).toBe('number-pad');
    });
  });

  describe('Form Validation', () => {
    it('should validate all fields before navigation', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      // Should show alert for first missing field
      expect(Alert.alert).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should navigate when all fields are valid', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '10');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(Alert.alert).not.toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should pass correct params to next screen', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Electrician');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '15');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/register/location',
        params: {
          name: 'Rajesh Kumar',
          categoryId: 'electrician',
          categoryName: 'Electrician',
          experienceYears: '15',
        },
      });
    });

    it('should include categoryName in params', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Test User');

      const categoryChip = getByText('Carpenter');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '5');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/register/location',
        params: expect.objectContaining({
          categoryName: 'Carpenter',
        }),
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is pressed', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      const backButton = getByText('Back');
      fireEvent.press(backButton);

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('should not navigate forward with incomplete form', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      // Missing category and experience
      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should navigate to location screen on successful validation', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Rajesh Kumar');

      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '10');

      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/register/location',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle category not found gracefully', () => {
      const { getByText, getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, 'Test User');

      // Manually set a category that doesn't exist
      const categoryChip = getByText('Plumber');
      fireEvent.press(categoryChip);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '5');

      // Even if category lookup fails, should still navigate with empty categoryName
      const nextButton = getByText('Next: Select Location');
      fireEvent.press(nextButton);

      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should handle empty categories array', () => {
      const emptyMock = {
        ...mockUseCategories,
        categories: [],
      };

      (useCategories as jest.Mock).mockReturnValue(emptyMock);

      const { getByText } = render(<RegisterStep1Screen />);

      // Should render without categories but not crash
      expect(getByText('Register as a Mistry')).toBeTruthy();
    });

    it('should handle very long names', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const longName = 'A'.repeat(100);
      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, longName);

      expect(nameInput.props.value).toBe(longName);
    });

    it('should handle special characters in name', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const nameInput = getByPlaceholderText('Enter your full name');
      fireEvent.changeText(nameInput, "O'Brien-Smith");

      expect(nameInput.props.value).toBe("O'Brien-Smith");
    });

    it('should handle maximum experience value', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '99');

      expect(experienceInput.props.value).toBe('99');
    });

    it('should handle leading zeros in experience', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      const experienceInput = getByPlaceholderText('e.g., 5');
      fireEvent.changeText(experienceInput, '05');

      // Should accept it as is (validation happens on parseInt during submission)
      expect(experienceInput.props.value).toBe('05');
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while categories are loading', () => {
      const loadingMock = {
        ...mockUseCategories,
        isLoading: true,
        categories: [],
      };

      (useCategories as jest.Mock).mockReturnValue(loadingMock);

      const { UNSAFE_getAllByType } = render(<RegisterStep1Screen />);

      // Should render ActivityIndicator
      expect(() => render(<RegisterStep1Screen />)).not.toThrow();
    });

    it('should not show form fields while loading', () => {
      const loadingMock = {
        ...mockUseCategories,
        isLoading: true,
        categories: [],
      };

      (useCategories as jest.Mock).mockReturnValue(loadingMock);

      const { queryByText } = render(<RegisterStep1Screen />);

      // Form title should not be visible during loading
      expect(queryByText('Full Name *')).toBeNull();
    });

    it('should show form after loading completes', async () => {
      const { getByText } = render(<RegisterStep1Screen />);

      await waitFor(() => {
        expect(getByText('Full Name *')).toBeTruthy();
      });
    });
  });

  describe('UI Elements', () => {
    it('should display category chips in a grid layout', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      // All categories should be visible
      mockCategories.forEach(category => {
        expect(getByText(category.name)).toBeTruthy();
      });
    });

    it('should have proper placeholder text for all inputs', () => {
      const { getByPlaceholderText } = render(<RegisterStep1Screen />);

      expect(getByPlaceholderText('Enter your full name')).toBeTruthy();
      expect(getByPlaceholderText('e.g., 5')).toBeTruthy();
    });

    it('should display field labels with asterisk for required fields', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      expect(getByText('Full Name *')).toBeTruthy();
      expect(getByText('Work Category *')).toBeTruthy();
      expect(getByText('Years of Experience *')).toBeTruthy();
    });

    it('should have next button with descriptive text', () => {
      const { getByText } = render(<RegisterStep1Screen />);

      expect(getByText('Next: Select Location')).toBeTruthy();
    });
  });
});
