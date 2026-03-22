import { useState, useCallback } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';

interface Location {
  id: string;
  name: string;
  nameHindi?: string;
}

interface State extends Location {
  stateId: string;
}

interface District extends Location {
  districtId: string;
  stateId: string;
}

interface Tehsil extends Location {
  tehsilId: string;
  districtId: string;
}

interface Town extends Location {
  townId: string;
  tehsilId: string;
}

export function useLocations() {
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [tehsils, setTehsils] = useState<Tehsil[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStates = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<{ states: State[] }>(API_ENDPOINTS.STATES);

      if (response.success && response.data) {
        setStates(response.data.states);
      } else {
        setError(response.error?.message || 'Failed to load states');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDistricts = useCallback(async (stateId: string) => {
    setIsLoading(true);
    setError(null);
    setDistricts([]);
    setTehsils([]);
    setTowns([]);

    try {
      const response = await api.get<{ districts: District[] }>(API_ENDPOINTS.DISTRICTS(stateId));

      if (response.success && response.data) {
        setDistricts(response.data.districts);
      } else {
        setError(response.error?.message || 'Failed to load districts');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTehsils = useCallback(async (districtId: string) => {
    setIsLoading(true);
    setError(null);
    setTehsils([]);
    setTowns([]);

    try {
      const response = await api.get<{ tehsils: Tehsil[] }>(API_ENDPOINTS.TEHSILS(districtId));

      if (response.success && response.data) {
        setTehsils(response.data.tehsils);
      } else {
        setError(response.error?.message || 'Failed to load tehsils');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTowns = useCallback(async (tehsilId: string) => {
    setIsLoading(true);
    setError(null);
    setTowns([]);

    try {
      const response = await api.get<{ towns: Town[] }>(API_ENDPOINTS.TOWNS(tehsilId));

      if (response.success && response.data) {
        setTowns(response.data.towns);
      } else {
        setError(response.error?.message || 'Failed to load towns');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    states,
    districts,
    tehsils,
    towns,
    isLoading,
    error,
    fetchStates,
    fetchDistricts,
    fetchTehsils,
    fetchTowns,
    clearError,
  };
}
