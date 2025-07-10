import { useQuery } from "@tanstack/react-query";

import useStore from "./useStore";

import getWeatherData from "../services/weather-data";
import { createLocationCacheKey } from "../utilities/locationKeyGenerator";

const useWeatherData = () => {
  const { userLocation } = useStore();
  const locationCacheKey = createLocationCacheKey(userLocation, 2);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["weatherData", locationCacheKey],
    queryFn: () => getWeatherData(userLocation),
  });

  const { currentWeather, hourlyWeather, dailyWeather, citiesWeather, weatherLayers, hazardLayers } = data || {};

  return {
    currentWeather,
    hourlyWeather,
    dailyWeather,
    citiesWeather,
    weatherLayers,
    hazardLayers,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  };
};

export default useWeatherData;
