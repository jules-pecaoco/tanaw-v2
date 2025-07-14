import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";

import CurrentWeatherCard from "../../../ui/analytics/CurrentWeatherCard";
import DailyForecastItem from "../../../ui/analytics/DailyForecastItem";

import useAnalyticsData from "../../../hooks/useAnalyticsData";
import useWeatherData from "../../../hooks/useWeatherData";
import { formatHourlyDataForChart } from "../../../utilities/dateTimeFormatter";

const AnalyticsScreen = () => {
  const { currentWeather, hourlyWeather, dailyWeather, isLoading, isError } = useWeatherData();
  const apiUrl =
    "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&daily=rain_sum,precipitation_sum,apparent_temperature_max&timezone=Asia%2FSingapore&start_date=2025-06-23&end_date=2025-07-20";
  const { weatherData, analytics, loading: analyticsIisLoading, error } = useAnalyticsData(apiUrl);

  const chartData = useMemo(() => formatHourlyDataForChart(hourlyWeather), [hourlyWeather]);

  if (isLoading || analyticsIisLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (isError || error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-tertiary text-center">Error: {(error || isError)?.message}</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" overScrollMode="never">
      <View className="p-5">
        {/* --- CURRENT CONDITIONS --- */}
        <Text className="text-2xl font-tbold text-secondary mb-2">Today's Weather</Text>
        <CurrentWeatherCard data={currentWeather} />

        {/* --- HOURLY CHART --- */}
        <View className="mt-8">
          <Text className="text-2xl font-tbold text-secondary mb-1">Today's Temperature Curve</Text>
          <Text className="text-sm text-gray-500 mb-2">Plan your day with hourly heat trends</Text>
          <View className="p-4 bg-white rounded-2xl shadow-sm">
            <LineChart data={chartData} startFillColor={"rgb(244,124,37)"} color="#F47C25" curved areaChart noOfSections={5} isAnimated />
          </View>
        </View>

        {/* --- DAILY FORECAST --- */}
        <View className="mt-8">
          <Text className="text-2xl font-tbold text-secondary mb-2">7-Day Forecast</Text>
          <ScrollView className="p-2 flex-row rounded-2xl h-[220px]" overScrollMode="never" horizontal showsHorizontalScrollIndicator={false}>
            {dailyWeather?.map((item, index) => (
              <DailyForecastItem key={index} item={item} />
            ))}
          </ScrollView>
        </View>

        {/* --- ANALYTICS HEADER --- */}
        <View className="bg-primary pt-12 pb-6 px-4 mt-8 rounded-b-2xl">
          <Text className="text-white text-2xl font-tbold">Weather Insights</Text>
          <Text className="text-white text-opacity-70 mt-1">{analytics.totalDays} days</Text>
        </View>

        {/* --- SUMMARY CARDS --- */}
        <View className="px-4 py-6">
          <View className="flex-row flex-wrap justify-between">
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Avg Temperature</Text>
              <Text className="text-2xl font-tbold text-primary mt-1">{analytics.avgTemperature}°C</Text>
            </View>
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Total Rain</Text>
              <Text className="text-2xl font-tbold text-blue-600 mt-1">{analytics.totalRain}mm</Text>
            </View>
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Rainy Days</Text>
              <Text className="text-2xl font-tbold text-blue-600 mt-1">{analytics.rainyDays}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Max Temp</Text>
              <Text className="text-2xl font-tbold text-red-600 mt-1">{analytics.maxTemperature}°C</Text>
            </View>
          </View>
        </View>

        {/* --- SUMMARY LIST --- */}
        <View className="mx-4 mb-10 bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-tbold text-secondary mb-4">1-Week Recap</Text>
          <View className="space-y-3">
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-gray-600">Total Precipitation</Text>
              <Text className="font-tmedium text-secondary">{analytics.totalPrecipitation}mm</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-gray-600">Min Temperature</Text>
              <Text className="font-tmedium text-secondary">{analytics.minTemperature}°C</Text>
            </View>
            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
              <Text className="text-gray-600">Max Temperature</Text>
              <Text className="font-tmedium text-secondary">{analytics.maxTemperature}°C</Text>
            </View>
            <View className="flex-row justify-between items-center py-2">
              <Text className="text-gray-600">Dry Days</Text>
              <Text className="font-tmedium text-secondary">{analytics.totalDays - analytics.rainyDays}</Text>
            </View>
          </View>
        </View>

        {/* --- CHARTS --- */}
        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-tbold text-secondary mb-4">Daily Temperature</Text>
          <LineChart
            data={analytics.chartData.temperature}
            startFillColor={"rgb(244,124,37)"}
            color="#F47C25"
            curved
            areaChart
            noOfSections={5}
            isAnimated
          />
        </View>

        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-tbold text-secondary mb-4">Precipitation Summary</Text>
          <BarChart data={analytics.chartData.precipitation} frontColor={"#1d4ed8" }noOfSections={5} isAnimated />
        </View>

        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-tbold text-secondary mb-4">Rainfall by Day</Text>
          <BarChart data={analytics.chartData.rain} frontColor={"#1d4ed8"} noOfSections={5} isAnimated />
        </View>
      </View>
    </ScrollView>
  );
};

export default AnalyticsScreen;
