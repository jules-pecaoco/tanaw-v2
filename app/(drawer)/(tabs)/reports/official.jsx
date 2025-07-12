import { Image } from "expo-image";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import supabase from "../../../../services/supabase";

const NewsArticleCard = ({ item }) => {
  const handlePress = () => {
    if (item.link) {
      WebBrowser.openBrowserAsync(item.link);
    }
  };

  const getSeverityClass = (severity) => {
    switch (severity?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md active:opacity-80">
      {item.image_url && (
        <Image
          source={{ uri: item.image_url }}
          // Per your request, using inline styles for the image component
          style={{ width: "100%", height: 200 }}
          placeholder={{ blurhash: "L6Pj0^i_.AyE_3t7t7R**0o#DgR4" }}
          transition={300}
        />
      )}
      <View className="p-4">
        <Text className="text-lg font-bold text-gray-900 mb-2">{item.title}</Text>
        <Text className="text-base text-gray-700 mb-3">{item.summary}</Text>
        <View className="flex-row justify-between items-center">
          <Text className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getSeverityClass(item.severity)}`}>{item.severity}</Text>
          <Text className="text-xs text-gray-500">{new Date(item.published_date).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// --- Card Component for Official Forecasts ---
const OfficialForecastCard = ({ item }) => {
  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md border-l-4 border-blue-600">
      <View className="p-4">
        <Text className="text-lg font-bold text-blue-800 mb-2">{item.cause}</Text>
        <Text className="text-base text-gray-800 mb-3 font-semibold">{item.potential_impacts}</Text>
        <View className="mb-3">
          <Text className="text-sm text-gray-500 mb-1">Affected Areas:</Text>
          <Text className="text-sm text-gray-700">{item.affected_areas.join(", ")}</Text>
        </View>
        <View>
          <Text className="text-sm text-gray-500 mb-1">Recommendations:</Text>
          {item.recommendations.map((rec, index) => (
            <Text key={index} className="text-sm text-gray-700 ml-2">
              {" "}
              • {rec}
            </Text>
          ))}
        </View>
        <Text className="text-xs text-gray-400 text-right mt-3">PAGASA Forecast</Text>
      </View>
    </View>
  );
};

// --- Main Feed Component ---
const OfficialReportFeed = () => {
  console.log("OfficialReportFeed component rendering");

  const [feedData, setFeedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOfficialData = async () => {
    setLoading(true);
    console.log("fetchOfficialData called");
    try {
      console.log("Starting Supabase function invoke...");
      const { data, error } = await supabase.functions.invoke("weather-news-scraper", {
        body: { name: "Functions" },
      });

      console.log("Raw data:", data);
      console.log("Data type:", typeof data);
      console.log("Data structure:", JSON.stringify(data, null, 2));

      if (error) {
        console.error("Error fetching official data:", error);
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

      console.log("News articles count:", news.length);
      console.log("Forecasts count:", forecasts.length);
      console.log("Sample news item:", news[0]);
      console.log("Sample forecast item:", forecasts[0]);

      // Combine, sort by date (newest first), and set the state
      const combinedData = [...news, ...forecasts];
      combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));

      console.log("Combined data count:", combinedData.length);
      console.log("Combined data sample:", combinedData.slice(0, 2));

      setFeedData(combinedData);
      setError(null);
    } catch (err) {
      console.error("Unexpected error in fetchOfficialData:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfficialData();
  }, []);

  const onRefresh = async () => {
    console.log("onRefresh called");
    setRefreshing(true);
    await fetchOfficialData();
    setRefreshing(false);
    console.log("onRefresh completed");
  };

  const renderItem = ({ item }) => {
    console.log("Rendering item:", item.type, item.id);
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
    console.log("Rendering error state");
    return (
      <View className="flex-1 justify-center items-center p-5">
        <Text className="text-red-500 text-center">{error}</Text>
      </View>
    );
  }

  console.log("Rendering FlatList with", feedData.length, "items");
  console.log("FlatList data:", feedData);
  return (
    <FlatList
      data={feedData}
      renderItem={renderItem}
      keyExtractor={(item, index) => {
        const key = item.id?.toString() || `item-${index}`;
        console.log("keyExtractor for item:", key, "index:", index);
        return key;
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1d4ed8" />}
      ListEmptyComponent={() => (
        <View className="flex-1 justify-center items-center p-8">
          <Text className="text-gray-500 text-center">No official reports available</Text>
        </View>
      )}
    />
  );
};

export default OfficialReportFeed;
