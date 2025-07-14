import { FlashList } from "@shopify/flash-list";
import { useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

import supabase from "../../../../services/supabase";

import NewsArticleCard from "../../../../ui/reports/NewsArticleCard";
import OfficialForecastCard from "../../../../ui/reports/OfficialForecastCard";

const OfficialReportFeed = () => {
  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOfficialData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("weather-news-scraper", {
        body: { name: "Functions" },
      });

      if (error) {
        setError("Could not load official reports. Please try again later.");
        return;
      }

      const news =
        data.news_articles?.map((item, index) => ({
          ...item,
          type: "news",
          date: item.published_date,
          id: item.id || `news-${index}`,
        })) || [];

      const forecasts =
        data.official_forecasts?.map((item, index) => ({
          ...item,
          type: "forecast",
          date: item.timestamp,
          id: item.id || `forecast-${index}`, // Ensure unique ID
        })) || [];

      const combinedData = [...news, ...forecasts];
      combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));

      setFeedData(combinedData);
      setError(null);
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficialData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOfficialData();
    setRefreshing(false);
  };

  const renderItem = ({ item }) => {
    if (item.type === "news") {
      return <NewsArticleCard item={item} />;
    }
    if (item.type === "forecast") {
      return <OfficialForecastCard item={item} />;
    }
    return null;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  console.log("OfficialReportFeed rendered");

  return (
    <FlashList
      estimatedItemSize={50}
      data={feedData}
      renderItem={renderItem}
      keyExtractor={(item, index) => {
        const key = item.id?.toString() || `item-${index}`;
        return key;
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#F47C25"]} />}
      ListEmptyComponent={() => (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-gray-500 text-center">No official reports available</Text>
        </View>
      )}
    />
  );
};

export default OfficialReportFeed;
