import { useQuery } from "@tanstack/react-query";

import getWeatherData from "../services/weather-data";
import { createLocationCacheKey } from "../utilities/index";

const useWeatherData = (userLocation) => {
  const locationCacheKey = createLocationCacheKey(userLocation, 2);

  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["weatherData", locationCacheKey],
    queryFn: () => getWeatherData(userLocation),
  });

  const { currentWeather, hourleyWeather, dailyWeather, nearbyLocationWeather, citiesWeather, weatherLayers, hazardLayers } = data || {};


  return {
    currentWeather,
    hourleyWeather,
    dailyWeather,
    nearbyLocationWeather,
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
