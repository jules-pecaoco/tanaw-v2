import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useEffect } from "react";
import { ScrollView, Text, View } from "react-native";

const ReportCard = ({ item }) => {
  const media = item.media_path || [];

  const firstUrl = media[0];

  const isVideo = firstUrl?.endsWith(".mp4") || firstUrl?.endsWith(".mov");

  const player = useVideoPlayer(isVideo ? firstUrl : null, (player) => {
    player.isMuted = true;
    player.loop = true;
  });

  useEffect(() => {
    if (isVideo) {
      player.play();
    }
  }, [isVideo, player]);

  return (
    <View className="bg-white rounded-lg overflow-hidden my-2 mx-4 shadow-md">
      {/* Media Container */}
      <View className="w-full aspect-video bg-background">
        {isVideo ? (
          <VideoView player={player} style={{ width: "100%", height: "100%" }} allowsFullscreen />
        ) : (
          media.length > 0 && (
            <ScrollView horizontal>
              {media.map((uri, index) => (
                <View key={index} className="m-2 aspect-video ">
                  <Image source={{ uri: uri }} contentFit="cover" style={{ aspectRatio: 16 / 9 }} />
                </View>
              ))}
            </ScrollView>
          )
        )}
      </View>
      {/* Content Container */}
      <View className="p-4">
        <Text className="text-base text-gray-800 mb-2 text-justify">{item.description}</Text>
        <View className="flex-row flex-wrap mb-2 items-center justify-between ">
          <View className="flex-row flex-wrap items-center">
            <Text className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold mr-2 mb-2 capitalize">{item.type}</Text>
            {item.sub_type && (
              <Text className="bg-gray-200 text-gray-800 rounded-full px-3 py-1 text-xs mr-2 mb-2 capitalize">
                {item.sub_type.replace(/_/g, " ")}
              </Text>
            )}
          </View>
          <Text className="text-xs text-gray-500 text-right">{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );
};

export default ReportCard;
