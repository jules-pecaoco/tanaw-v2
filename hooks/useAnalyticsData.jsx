import { useCallback, useEffect, useState } from "react";

const useAnalyticsData = (apiUrl) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState(null);

  // Format date to readable format
  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []);

  // Process analytics data
  const processAnalytics = useCallback(
    (data) => {
      if (!data || !data.daily) return;

      const { time, rain_sum, precipitation_sum, apparent_temperature_max } = data.daily;

      // Calculate analytics
      const totalRain = rain_sum.reduce((sum, val) => sum + val, 0);
      const totalPrecipitation = precipitation_sum.reduce((sum, val) => sum + val, 0);
      const avgTemperature = apparent_temperature_max.reduce((sum, val) => sum + val, 0) / apparent_temperature_max.length;
      const maxTemperature = Math.max(...apparent_temperature_max);
      const minTemperature = Math.min(...apparent_temperature_max);
      const rainyDays = rain_sum.filter((val) => val > 0).length;

      // value: Math.floor(item.heat_index),
      //       label: formatTo12HourTime(date, { showMinutes: false }),
      //       dataPointText: Math.floor(item.heat_index)

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

      setAnalytics({
        totalRain: totalRain.toFixed(2),
        totalPrecipitation: totalPrecipitation.toFixed(2),
        avgTemperature: avgTemperature.toFixed(1),
        maxTemperature: maxTemperature.toFixed(1),
        minTemperature: minTemperature.toFixed(1),
        rainyDays,
        chartData,
        totalDays: time.length,
      });
    },
    [formatDate]
  );

  // Fetch weather data function
  const fetchWeatherData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWeatherData(data);
      processAnalytics(data);
    } catch (err) {
      console.error("Error fetching weather data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiUrl, processAnalytics]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchWeatherData();
  }, [fetchWeatherData]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weatherData,
    analytics,
    loading,
    refreshing,
    error,
    refresh,
  };
};

export default useAnalyticsData;
