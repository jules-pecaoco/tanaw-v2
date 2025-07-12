import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import supabase from "../../../../services/supabase";

const ReportCard = ({ item }) => {
  console.log("ReportCard rendering for item:", item.id);
  console.log("Item media_path:", item.media_path);

  // Construct the full public URL for each media file.
  const mediaUrls =
    item.media_path?.map((path) => {
      console.log("Processing media path:", path);
      const { data } = supabase.storage.from("hazard-media").getPublicUrl(path);
      console.log("Generated public URL:", data.publicUrl);
      return data.publicUrl;
    }) || [];

  const firstUrl = mediaUrls[0];
  console.log("First URL:", firstUrl);

  const isVideo = firstUrl?.endsWith(".mp4") || firstUrl?.endsWith(".mov");
  console.log("Is video:", isVideo);

  // useVideoPlayer must be called at the top level.
  // We pass the URL if it's a video, otherwise null.
  const player = useVideoPlayer(isVideo ? firstUrl : null, (player) => {
    console.log("Video player callback triggered");
    player.isMuted = true;
    player.loop = true;
  });

  useEffect(() => {
    console.log("ReportCard useEffect triggered, isVideo:", isVideo);
    if (isVideo) {
      console.log("Playing video");
      player.play();
    }
    // The player will be cleaned up automatically when the component unmounts.
  }, [isVideo, player]);

  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md">
      {/* Media Container */}
      <View className="w-full aspect-video bg-gray-200">
        {isVideo ? (
          <VideoView player={player} style={{ width: "100%", height: "100%" }} allowsFullscreen />
        ) : (
          <Image
            source={{ uri: firstUrl }}
            style={{ width: "100%", height: "100%" }}
            placeholder={{ blurhash: "L6Pj0^i_.AyE_3t7t7R**0o#DgR4" }} // A nice placeholder effect
            transition={500}
            contentFit="cover"
          />
        )}
      </View>
      {/* Content Container */}
      <View className="p-4">
        <Text className="text-base text-gray-800 mb-2">{item.description}</Text>
        <View className="flex-row flex-wrap mb-2">
          <Text className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold mr-2 mb-2 capitalize">{item.type}</Text>
          {item.sub_type && (
            <Text className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-xs mr-2 mb-2 capitalize">{item.sub_type.replace(/_/g, " ")}</Text>
          )}
        </View>
        <Text className="text-xs text-gray-500 text-right">{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );
};

// The main component that fetches and lists all reports
const CommunityReportsFeed = () => {
  console.log("HazardReportsFeed component rendering");

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    console.log("fetchReports called");
    try {
      console.log("Starting Supabase query...");
      const { data, error } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false });

      console.log("Supabase query completed");
      console.log("Data received:", data);
      console.log("Error:", error);

      if (error) {
        console.error("Error fetching reports:", error);
        setError(error.message);
      } else {
        console.log("Setting reports data, count:", data?.length || 0);
        setReports(data || []);
        setError(null);
      }
    } catch (err) {
      console.error("Unexpected error in fetchReports:", err);
      setError(err.message);
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("HazardReportsFeed useEffect triggered");
    fetchReports();
  }, []);

  const onRefresh = async () => {
    console.log("onRefresh called");
    setRefreshing(true);
    await fetchReports();
    setRefreshing(false);
    console.log("onRefresh completed");
  };

  console.log("Current state - loading:", loading, "error:", error, "reports count:", reports.length);

  if (loading) {
    console.log("Rendering loading state");
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F47C25" />
      </View>
    );
  }

  if (error) {
    console.log("Rendering error state");
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-red-500 text-center">Error: {error}</Text>
      </View>
    );
  }

  console.log("Rendering FlatList with", reports.length, "reports");
  return (
    <FlatList
      data={reports}
      renderItem={({ item }) => {
        console.log("FlatList rendering item:", item.id);
        return <ReportCard item={item} />;
      }}
      keyExtractor={(item) => {
        console.log("keyExtractor for item:", item.id);
        return item.id.toString();
      }}
      contentContainerClassName="py-2"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    />
  );
};

export default CommunityReportsFeed;
