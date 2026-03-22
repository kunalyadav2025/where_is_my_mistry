import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { API_ENDPOINTS } from '@/constants/api';
import type { State, District, Town } from '@/shared/types';

interface ResolvedLocation {
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  townId: string;
  townName: string;
}

interface UseLocationResolverParams {
  district?: string;
  state?: string;
}

interface UseLocationResolverResult {
  resolvedLocation: ResolvedLocation | null;
  isLoading: boolean;
  error: string | null;
  resolve: (district: string, state: string) => Promise<void>;
}

interface StatesResponse {
  states: State[];
}

interface DistrictsResponse {
  districts: District[];
}

interface TownsResponse {
  towns: Town[];
}

// Simple cache to avoid repeated API calls
const locationCache = new Map<string, ResolvedLocation>();

export function useLocationResolver(params: UseLocationResolverParams = {}): UseLocationResolverResult {
  const [resolvedLocation, setResolvedLocation] = useState<ResolvedLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = useCallback(async (districtName: string, stateName: string) => {
    if (!districtName || !stateName) {
      return;
    }

    const cacheKey = `${districtName.toLowerCase()}-${stateName.toLowerCase()}`;

    // Check cache first
    const cached = locationCache.get(cacheKey);
    if (cached) {
      setResolvedLocation(cached);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get all states and find matching state
      const statesResponse = await api.get<StatesResponse>(API_ENDPOINTS.STATES);

      if (!statesResponse.success || !statesResponse.data?.states) {
        throw new Error('Failed to fetch states');
      }

      const normalizedStateName = stateName.toLowerCase().trim();
      const matchedState = statesResponse.data.states.find(
        (s) =>
          s.name.toLowerCase().includes(normalizedStateName) ||
          normalizedStateName.includes(s.name.toLowerCase()) ||
          s.nameHindi === stateName
      );

      if (!matchedState) {
        setError(`State "${stateName}" not found`);
        setIsLoading(false);
        return;
      }

      // Step 2: Get districts in the matched state
      const districtsResponse = await api.get<DistrictsResponse>(
        API_ENDPOINTS.DISTRICTS(matchedState.stateId)
      );

      if (!districtsResponse.success || !districtsResponse.data?.districts) {
        throw new Error('Failed to fetch districts');
      }

      const normalizedDistrictName = districtName.toLowerCase().trim();
      const matchedDistrict = districtsResponse.data.districts.find(
        (d) =>
          d.name.toLowerCase().includes(normalizedDistrictName) ||
          normalizedDistrictName.includes(d.name.toLowerCase()) ||
          d.nameHindi === districtName
      );

      if (!matchedDistrict) {
        setError(`District "${districtName}" not found in ${matchedState.name}`);
        setIsLoading(false);
        return;
      }

      // Step 3: Get first tehsil in the district to get a town
      const tehsilsResponse = await api.get<{ tehsils: { tehsilId: string }[] }>(
        API_ENDPOINTS.TEHSILS(matchedDistrict.districtId)
      );

      if (!tehsilsResponse.success || !tehsilsResponse.data?.tehsils?.length) {
        throw new Error('Failed to fetch tehsils');
      }

      const firstTehsil = tehsilsResponse.data.tehsils[0];

      // Step 4: Get first town in the tehsil
      const townsResponse = await api.get<TownsResponse>(
        API_ENDPOINTS.TOWNS(firstTehsil.tehsilId)
      );

      if (!townsResponse.success || !townsResponse.data?.towns?.length) {
        throw new Error('No towns found in this area');
      }

      const firstTown = townsResponse.data.towns[0];

      const resolved: ResolvedLocation = {
        stateId: matchedState.stateId,
        stateName: matchedState.name,
        districtId: matchedDistrict.districtId,
        districtName: matchedDistrict.name,
        townId: firstTown.townId,
        townName: firstTown.name,
      };

      // Cache the result
      locationCache.set(cacheKey, resolved);
      setResolvedLocation(resolved);
    } catch (err) {
      console.error('Location resolution error:', err);
      setError(err instanceof Error ? err.message : 'Failed to resolve location');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params.district && params.state) {
      resolve(params.district, params.state);
    }
  }, [params.district, params.state, resolve]);

  return {
    resolvedLocation,
    isLoading,
    error,
    resolve,
  };
}
