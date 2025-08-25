import { useMemo } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";

import CurrentWeatherCard from "../../../../ui/analytics/CurrentWeatherCard";
import DailyForecastItem from "../../../../ui/analytics/DailyForecastItem";

import useWeatherData from "../../../../hooks/useWeatherData";
import { formatHourlyDataForChart } from "../../../../utilities/dateTimeFormatter";

const Forecast = () => {
  const { currentWeather, hourlyWeather, dailyWeather, isLoading, isError } = useWeatherData();

  const chartData = useMemo(() => formatHourlyDataForChart(hourlyWeather), [hourlyWeather]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-tertiary text-center">Error: {isError?.message}</Text>
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
        <View className="mt-8 mb-10">
          <Text className="text-2xl font-tbold text-secondary mb-2">7-Day Forecast</Text>
          <ScrollView className="p-2 flex-row rounded-2xl h-[220px]" overScrollMode="never" horizontal showsHorizontalScrollIndicator={false}>
            {dailyWeather?.map((item, index) => (
              <DailyForecastItem key={index} item={item} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default Forecast;
