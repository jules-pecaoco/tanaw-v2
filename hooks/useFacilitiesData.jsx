import { useQuery } from "@tanstack/react-query";

import getFacilitiesData from "../services/facilities-data";
import { createLocationCacheKey } from "../utilities/locationKeyGenerator";

const useFacilitiesData = (userLocation) => {
  const locationCacheKey = createLocationCacheKey(userLocation, 2);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["facilitiesData", locationCacheKey],
    queryFn: () => getFacilitiesData(userLocation),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchInterval: 1000 * 60 * 60 * 24, // 24 hours
  });

  return {
    facilitiesData: data,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  };
};

export default useFacilitiesData;
