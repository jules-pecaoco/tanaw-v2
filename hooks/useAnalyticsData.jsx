import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import useStore from "./useStore";

const useAnalyticsData = () => {
  // GET USER LOCATION FROM STORE
  const { userLocation } = useStore();

  // Format date to readable format
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  // Fetch weather data function
  const fetchWeatherData = async () => {
    // Calculate dates: 1 week before and 1 week after current date
    const today = new Date();
    const oneWeekBefore = new Date(today);
    oneWeekBefore.setDate(today.getDate() - 7);
    const oneWeekAfter = new Date(today);
    oneWeekAfter.setDate(today.getDate() + 7);

    // Format dates to YYYY-MM-DD
    const startDate = oneWeekBefore.toISOString().split("T")[0];
    const endDate = oneWeekAfter.toISOString().split("T")[0];

    // USE DYNAMIC USER LOCATION
    const latitude = userLocation.latitude;
    const longitude = userLocation.longitude;

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=rain_sum,precipitation_sum,apparent_temperature_max&timezone=Asia%2FManila&start_date=${startDate}&end_date=${endDate}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // TanStack Query hook
  const {
    data: weatherData,
    isLoading: loading,
    isFetching: refreshing,
    error,
    refetch: refresh,
  } = useQuery({
    queryKey: ["weatherData", userLocation.latitude, userLocation.longitude],
    queryFn: fetchWeatherData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Process analytics data using useMemo for performance
  const analytics = useMemo(() => {
    if (!weatherData || !weatherData.daily) return null;

    const { time, rain_sum, precipitation_sum, apparent_temperature_max } = weatherData.daily;

    // Calculate analytics
    const totalRain = rain_sum.reduce((sum, val) => sum + val, 0);
    const totalPrecipitation = precipitation_sum.reduce((sum, val) => sum + val, 0);
    const avgTemperature = apparent_temperature_max.reduce((sum, val) => sum + val, 0) / apparent_temperature_max.length;
    const maxTemperature = Math.max(...apparent_temperature_max);
    const minTemperature = Math.min(...apparent_temperature_max);
    const rainyDays = rain_sum.filter((val) => val > 0).length;

    // Prepare chart data
    const temp = [];
    const preci = [];
    const rain = [];

    time.forEach((date, index) => {
      temp.push({
        value: Math.floor(apparent_temperature_max[index]),
        label: formatDate(date),
        dataPointText: Math.floor(apparent_temperature_max[index]),
      });
      preci.push({
        value: Math.floor(precipitation_sum[index]),
        label: formatDate(date),
        dataPointText: Math.floor(precipitation_sum[index]),
      });
      rain.push({
        value: Math.floor(rain_sum[index]),
        label: formatDate(date),
        dataPointText: Math.floor(rain_sum[index]),
      });
    });

    const chartData = {
      temperature: temp,
      precipitation: preci,
      rain: rain,
    };

    return {
      totalRain: totalRain.toFixed(2),
      totalPrecipitation: totalPrecipitation.toFixed(2),
      avgTemperature: avgTemperature.toFixed(1),
      maxTemperature: maxTemperature.toFixed(1),
      minTemperature: minTemperature.toFixed(1),
      rainyDays,
      chartData,
      totalDays: time.length,
    };
  }, [weatherData, formatDate]);

  return {
    weatherData,
    analytics,
    loading,
    refreshing,
    error: error?.message || null,
    refresh: () => refresh(),
  };
};

export default useAnalyticsData;
