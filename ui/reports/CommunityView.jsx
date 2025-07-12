import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from "react-native";
import { supabase } from "../../services/supabase";

const ReportCard = ({ item }) => {
  // Construct the full public URL for each media file.
  const mediaUrls =
    item.media_path?.map((path) => {
      const { data } = supabase.storage.from("hazard-media").getPublicUrl(path);
      return data.publicUrl;
    }) || [];

  const firstUrl = mediaUrls[0];
  const isVideo = firstUrl?.endsWith(".mp4") || firstUrl?.endsWith(".mov");

  // useVideoPlayer must be called at the top level.
  // We pass the URL if it's a video, otherwise null.
  const player = useVideoPlayer(isVideo ? firstUrl : null, (player) => {
    player.isMuted = true;
    player.loop = true;
  });

  useEffect(() => {
    if (isVideo) {
      player.play();
    }
    // The player will be cleaned up automatically when the component unmounts.
  }, [isVideo, player]);

  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md">
      {/* Media Container */}
      <View className="w-full aspect-video bg-gray-200">
        {isVideo ? (
          <VideoView player={player} className="w-full h-full" allowsFullscreen />
        ) : (
          <Image
            source={{ uri: firstUrl }}
            className="w-full h-full"
            placeholder={{ blurhash: "L6Pj0^i_.AyE_3t7t7R**0o#DgR4" }} // A nice placeholder effect
            transition={500}
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
const HazardReportsFeed = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = async () => {
    const { data, error } = await supabase.from("user_reports").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      setError(error.message);
    } else {
      setReports(data);
    }
    setLoading(false);
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
        <ActivityIndicator size="large" color="#4f46e5" />
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
    <FlatList
      data={reports}
      renderItem={({ item }) => <ReportCard item={item} />}
      keyExtractor={(item) => item.id}
      contentContainerClassName="py-2"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />}
    />
  );
};

export default HazardReportsFeed;
