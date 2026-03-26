import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  latitude: number;
  longitude: number;
}

interface ReverseGeocodedLocation {
  city?: string;
  district?: string;
  state?: string;
  country?: string;
}

interface UseLocationResult {
  location: LocationData | null;
  geocoded: ReverseGeocodedLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: Location.PermissionStatus | null;
  refresh: () => Promise<void>;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [geocoded, setGeocoded] = useState<ReverseGeocodedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);

  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<ReverseGeocodedLocation | null> => {
    try {
      // Use OpenStreetMap Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WhereIsMyMistry/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      const address = data.address || {};

      return {
        city: address.city || address.town || address.village || address.suburb,
        district: address.state_district || address.county,
        state: address.state,
        country: address.country,
      };
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return null;
    }
  }, []);

  const fetchLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check current permission status
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status !== Location.PermissionStatus.GRANTED) {
        setError('Location permission not granted');
        setIsLoading(false);
        return;
      }

      // Get current position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setLocation(locationData);

      // Reverse geocode to get address
      const geocodedResult = await reverseGeocode(locationData.latitude, locationData.longitude);
      setGeocoded(geocodedResult);
    } catch (err) {
      console.error('Location error:', err);
      setError('Failed to get location');
    } finally {
      setIsLoading(false);
    }
  }, [reverseGeocode]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);

      if (status === Location.PermissionStatus.GRANTED) {
        await fetchLocation();
        return true;
      }

      setError('Location permission denied');
      return false;
    } catch (err) {
      console.error('Permission request error:', err);
      setError('Failed to request location permission');
      return false;
    }
  }, [fetchLocation]);

  const refresh = useCallback(async () => {
    await fetchLocation();
  }, [fetchLocation]);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    location,
    geocoded,
    isLoading,
    error,
    permissionStatus,
    refresh,
    requestPermission,
  };
}
