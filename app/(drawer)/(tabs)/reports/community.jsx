import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { memo, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

import supabase from "../../../../services/supabase";

import BouncingButton from "../../../../ui/components/BouncingButton";
import ReportCard from "../../../../ui/reports/ReportCard";

const ReportButton = memo(() => {
  return (
    <BouncingButton
      onPress={() => {
        router.navigate("report");
      }}
    >
      <View className="bg-primary rounded-full p-5 shadow-lg">
        <Ionicons name="add" size={24} color={"#fffcfa"} />
      </View>
    </BouncingButton>
  );
});

const CommunityReportsFeed = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setReports(data || []);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
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
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <FlashList
        data={reports}
        renderItem={({ item }) => <ReportCard item={item} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={30}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#F47C25"]} />}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center p-8">
            <Text className="text-gray-500 text-center">No Community reports available</Text>
          </View>
        )}
      />
      <View className="absolute bottom-10 right-8">
        <ReportButton />
      </View>
    </View>
  );
};

export default CommunityReportsFeed;
