import { useQuery } from "@tanstack/react-query";

import useStore from "./useStore";

import getFacilitiesData from "../services/facilities-data";
import { createLocationCacheKey } from "../utilities/locationKeyGenerator";

const useFacilitiesData = () => {
  const { userLocation } = useStore();

  const locationCacheKey = createLocationCacheKey(userLocation, 2);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["facilitiesData", locationCacheKey],
    queryFn: () => getFacilitiesData(userLocation),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
    cacheTime: 1000 * 60 * 60 * 24, // 24 hours
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    retry: 1, // Retry once on failure
    refetchInterval: 1000 * 60 * 60 * 24, // Refetch every 24 hours
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
