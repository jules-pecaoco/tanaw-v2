import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CurrentWeatherCard from "../../../ui/analytics/CurrentWeatherCard";
import DailyForecastItem from "../../../ui/analytics/DailyForecastItem";

import useWeatherData from "../../../hooks/useWeatherData";

import { formatHourlyDataForChart } from "../../../utilities/dateTimeFormatter";

const AnalyticsScreen = () => {
  const { currentWeather, hourlyWeather, dailyWeather, isLoading, isError, error } = useWeatherData();
  const insets = useSafeAreaInsets(); 

  const chartData = useMemo(() => formatHourlyDataForChart(hourlyWeather), [hourlyWeather]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-100 p-5">
        <Text className="text-red-500 text-center">Error: {error.message}</Text>
      </View>
    );
  }

  console.log("Rendering AnalyticsScreen with data:")

  return (
    <ScrollView 
      className="flex-1 bg-gray-100"
      overScrollMode='never'
    >
      <View className="p-5">
        {/* --- Current Weather Section --- */}
        <Text className="text-2xl font-tbold text-gray-800 mb-4">Current Conditions</Text>
        <CurrentWeatherCard data={currentWeather} />

        {/* --- Hourly Forecast Chart --- */}
        <View className="mt-8">
          <Text className="text-2xl font-tbold text-gray-800 mb-4">Hourly Heat Index</Text>
          <View className="p-4 bg-white rounded-2xl shadow-sm w-fit overflow-hidden">
            <LineChart
              data={chartData}
              color="#F47C25"
              maxValue={50}
              noOfSections={5}
              curved
              areaChart
              startFillColor={'rgb(244,124,37)'}
              yAxisTextStyle={{ color: 'gray' }}
              xAxisLabelTextStyle={{ color: 'gray' }}
              isAnimated
              endSpacing={-20}
              overScrollMode='never'
              dataPointsHeight={6}
              dataPointsWidth={6}
              textShiftY={-2}
              textShiftX={-5}
              textFontSize={13}
            />
          </View>
        </View>

        {/* --- Daily Forecast List --- */}
        <View className="mt-8 ">
          <Text className="text-2xl font-tbold text-gray-800 mb-2">7-Day Heat Index Forecast</Text>
          <ScrollView className="p-2 flex-row rounded-2xl  h-[220px]" overScrollMode='never' horizontal={true} showsHorizontalScrollIndicator={false}>
            {dailyWeather?.map((item, index) => (
              <DailyForecastItem key={index} item={item} />
            ))}
          </ScrollView>
        </View>
      </View>
    </ScrollView>
  );
};

export default AnalyticsScreen;