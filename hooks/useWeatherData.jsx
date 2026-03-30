import { useQuery } from "@tanstack/react-query";

import useStore from "./useStore";

import { fetchHazardData, fetchWeatherData } from "../services/weather-data";

const useWeatherData = () => {
  const { userLocation } = useStore();

  const {
    data: weatherData,
    isLoading: isWeatherLoading,
    isError: isWeatherError,
    error: weatherError,
    refetch: refetchWeatherData,
    isRefetching: isWeatherRefetching,
  } = useQuery({
    queryKey: ["weatherData", userLocation],
    queryFn: () => fetchWeatherData(userLocation),
  });

  const {
    data: hazardData,
    isLoading: isHazardLoading,
    isError: isHazardError,
    error: hazardError,
  } = useQuery({
    queryKey: ["hazardData"],
    queryFn: fetchHazardData,
    staleTime: Infinity,
    cacheTime: Infinity,
  });

  return {
    currentWeather: weatherData?.currentWeather,
    hourlyWeather: weatherData?.hourlyWeather,
    dailyWeather: weatherData?.dailyWeather,
    weatherLayers: weatherData?.weatherLayers,

    hazardLayers: hazardData?.hazardLayers,

    isLoading: isWeatherLoading || isHazardLoading,
    isRefetching: isWeatherRefetching, // Only weather data can be refetched
    isError: isWeatherError || isHazardError,
    error: weatherError || hazardError,

    refetch: refetchWeatherData,
  };
};

export default useWeatherData;
