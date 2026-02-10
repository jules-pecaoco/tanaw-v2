import { ActivityIndicator, RefreshControl, ScrollView, Text, View } from "react-native";
import { BarChart, LineChart } from "react-native-gifted-charts";
import useReportAnalyticsData from "../../../../hooks/useReportAnalyticsData";
import useUserReportsData from "../../../../hooks/useUserReportsData";
import useAnalyticsData from "../../../../hooks/useAnalyticsData";

const ReportAnalytics = () => {
  const { userReports, isLoading, error } = useUserReportsData();
  const { analytics } = useReportAnalyticsData(userReports);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-tertiary text-center">Error: {error?.message}</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View className="flex-1 items-center justify-center bg-background p-5">
        <Text className="text-secondary text-center font-tmedium text-lg">No user reports to analyze.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-background" overScrollMode="never">
      <View className="p-5">
        {/* --- ANALYTICS HEADER --- */}
        <View className="pt-12 pb-6 px-4 rounded-b-2xl">
          <Text className="text-black text-4xl font-tbold">Community Insights</Text>
        </View>

        {/* --- SUMMARY CARDS --- */}
        <View className="px-4 py-6">
          <View className="flex-row flex-wrap justify-between">
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Total Reports</Text>
              <Text className="text-2xl font-tbold text-primary mt-1">{analytics.totalReports}</Text>
            </View>
            <View className="bg-white rounded-xl p-4 mb-4 w-[48%] shadow-sm">
              <Text className="text-gray-500 text-sm">Top Hazard</Text>
              <Text className="text-2xl font-tbold text-tertiary mt-1">{analytics.mostFrequentHazard}</Text>
            </View>
          </View>
        </View>

        {/* --- SUMMARY LIST (Report Types) --- */}
        <View className="mx-4 mb-10 bg-white rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-tbold text-secondary mb-4">Hazard Breakdown</Text>
          <View className="space-y-3">
            {analytics.typeDistribution.map((item, index) => (
              <View
                key={item.type}
                className={`flex-row justify-between items-center py-2 ${index !== analytics.typeDistribution.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <Text className="text-gray-600">{item.type}</Text>
                <Text className="font-tmedium text-secondary">{item.count} reports</Text>
              </View>
            ))}
          </View>
        </View>

        {/* --- CHART --- */}
        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm overflow-hidden">
          <Text className="text-lg font-tbold text-secondary mb-4">Daily Report Frequency</Text>
          <BarChart
            data={analytics.chartData}
            frontColor={"#F47C25"}
            noOfSections={4}
            isAnimated
            yAxisTextStyle={{ color: "gray" }}
            xAxisLabelTextStyle={{ color: "gray", fontSize: 10 }}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const Analytics = () => {
  const { analytics, loading, refreshing, error, refresh } = useAnalyticsData();

  // Show full screen loader only on initial load
  if (loading && !refreshing) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (error) {
    return (
      <ScrollView
        className="flex-1 bg-background"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={["#F47C25"]}
            tintColor="#F47C25"
          />
        }
      >
        <View className="flex-1 items-center justify-center bg-background p-5 min-h-screen">
          <Text className="text-tertiary text-center">Error: {error}</Text>
          <Text className="text-secondary text-center mt-2">Pull down to retry</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-background" 
      overScrollMode="never"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={["#F47C25"]}
          tintColor="#F47C25"
          title="Updating analytics..."
          titleColor="#F47C25"
        />
      }
    >
      <View className="p-5">
        {/* --- ANALYTICS HEADER --- */}
        <View className="pt-12 pb-6 px-4 rounded-b-2xl">
          <Text className="text-black text-4xl font-tbold">Weather Insights</Text>
          <Text className="text-black text-lg text-opacity-70 mt-1">{analytics.totalDays} days</Text>
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
        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm overflow-hidden">
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

        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm overflow-hidden">
          <Text className="text-lg font-tbold text-secondary mb-4">Precipitation by Day</Text>
          <BarChart data={analytics.chartData.precipitation} frontColor={"#1d4ed8"} noOfSections={5} isAnimated />
        </View>

        <View className="mx-4 mb-6 bg-white rounded-xl p-4 shadow-sm overflow-hidden">
          <Text className="text-lg font-tbold text-secondary mb-4">Rainfall by Day</Text>
          <BarChart data={analytics.chartData.rain} frontColor={"#1d4ed8"} noOfSections={5} isAnimated />
        </View>
      </View>
      <ReportAnalytics />
    </ScrollView>
  );
};

export default Analytics;