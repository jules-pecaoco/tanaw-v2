import Ionicons from "@expo/vector-icons/Ionicons";
import { FunctionsHttpError } from "@supabase/supabase-js";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, Text, TouchableOpacity, View } from "react-native";

import useLocation from "../../hooks/useLocation";
import useStore from "../../hooks/useStore";

import supabase from "../../services/supabase";
import { compressImage, compressVideo } from "../../utilities/mediaCompression";

export default function HazardReportForm() {
  const { userExpoToken, userId } = useStore();
  const { getCurrentLocation } = useLocation();
  const [media, setMedia] = useState([]);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      const coords = await getCurrentLocation();
      setLocation(coords);
    };
    fetchLocation();
  }, []);

  const pickMedia = async () => {
    const images = media.filter((m) => m.type === "image");
    const videos = media.filter((m) => m.type === "video");

    if (images.length > 0 && videos.length > 0) {
      Alert.alert("Invalid", "Cannot mix images and video.");
      return;
    }

    if (videos.length >= 1 || images.length >= 3) {
      Alert.alert("Limit reached", "You can only upload 1 video or 3 images.");
      return;
    }

    // Request camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission needed", "Camera permission is required");
      return;
    }

    Alert.alert("Capture Media", "Choose what to capture", [
      { text: "Take Photo", onPress: () => openCamera() },
      { text: "Record Video (15s max)", onPress: () => openVideo() },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.7,
      videoMaxDuration: 15,
    });

    if (!result.canceled) {
      await processSelectedMedia(result.assets[0]);
    }
  };

  const openVideo = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 0.7,
      videoMaxDuration: 15,
    });

    if (!result.canceled) {
      await processSelectedMedia(result.assets[0]);
    }
  };

  const processSelectedMedia = async (asset) => {
    try {
      setLoading(true);

      let compressedMedia;

      if (asset.type === "video") {
        compressedMedia = await compressVideo(asset.uri);
      } else {
        compressedMedia = await compressImage(asset.uri);
      }

      setMedia((prev) => [...prev, compressedMedia]);
    } catch (error) {
      console.error("Media processing error:", error);
      Alert.alert("Error", "Failed to process selected media");
    } finally {
      setLoading(false);
    }
  };

  const removeMedia = (index) => {
    setMedia((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper function to validate media requirements
  const validateMediaRequirements = () => {
    if (media.length === 0) {
      return { isValid: false, message: "Please add at least one photo or video" };
    }

    const images = media.filter((item) => item.type === "image");
    const videos = media.filter((item) => item.type === "video");

    // Check if we have at least 3 images OR at least 1 video
    if (images.length >= 3 || videos.length >= 1) {
      return { isValid: true, message: "" };
    }

    return {
      isValid: false,
      message: "Please add at least 3 images or 1 video (15 seconds max)",
    };
  };

  const uploadToSupabase = async (file, name) => {
    name = name || `${file.type}_${Date.now()}.${file.type === "image" ? "jpg" : "mp4"}`;
    const fileExt = name.split(".").pop();
    const filePath = `tmp/${name}`;

    const { data, error } = await supabase.storage.from("hazard-media").upload(
      filePath,
      {
        uri: file.uri,
        type: file.type === "image" ? "image/jpeg" : "video/mp4",
        name,
      },
      {
        contentType: file.type === "image" ? "image/jpeg" : "video/mp4",
        upsert: true,
      }
    );

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    return filePath;
  };

  const submitReport = async () => {
    const validation = validateMediaRequirements();
    if (!validation.isValid) {
      Alert.alert("Error", validation.message);
      return;
    }

    if (!location) {
      Alert.alert("Error", "Location is required. Please enable location services.");
      return;
    }

    try {
      setSubmitting(true);

      const uploadedMedia = [];
      for (const file of media) {
        const uploadedPath = await uploadToSupabase(file, file.name);
        uploadedMedia.push({
          uri: uploadedPath,
          type: file.type,
          name: file.name || `${file.type}_${Date.now()}`,
        });
        console.log("Uploaded media:", uploadedPath);
      }

      const { data, error } = await supabase.functions.invoke("reports-service", {
        body: {
          user_id: userId,
          expo_token: userExpoToken,
          media_files: uploadedMedia,
          location: location,
        },
      });

      if (error && error instanceof FunctionsHttpError) {
        const errorMessage = await error.context.json();
        console.log("Function returned an error", errorMessage);
        Alert.alert("Error", errorMessage.error || "An error occurred.");
        return;
      }

      if (data?.success) {
        Alert.alert("Success", data.message);
        setMedia([]);
      } else {
        Alert.alert("Report Rejected", data.reason || "No hazard detected.");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if submit button should be enabled
  const isSubmitEnabled = () => {
    const validation = validateMediaRequirements();
    return validation.isValid && location && !submitting;
  };

  return (
    <ScrollView className="flex-1 bg-gray-100" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="p-5">
        {/* --- Header Section --- */}
        <Text className="text-3xl font-tbold text-gray-800 text-center mb-2">Report a Hazard</Text>
        <Text className="text-base font-tregular text-gray-500 text-center mb-2">Your submission helps keep the community safe.</Text>
        <Text className="text-sm font-tregular text-gray-400 text-center mb-8">Required: At least 3 images or 1 video (15s max)</Text>

        {/* --- Media Upload Section --- */}
        <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-tsemibold text-gray-700">Media Attachments</Text>
            <Text className="text-sm font-tregular text-gray-500">{media.length} / 3</Text>
          </View>

          {/* Media Grid */}
          <View className="flex-row flex-wrap -mx-1">
            {media.map((item, index) => (
              <View key={index} className="w-1/3 p-1">
                <View className="relative">
                  <Image source={{ uri: item.uri }} className="w-full h-24 rounded-lg" />
                  {/* Video indicator */}
                  {item.type === "video" && (
                    <View className="absolute bottom-1 left-1 bg-black bg-opacity-50 px-2 py-1 rounded">
                      <Text className="text-white text-xs">VIDEO</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={() => removeMedia(index)}
                    className="absolute -top-1 -right-1 bg-red-500 w-6 h-6 rounded-full items-center justify-center border-2 border-white"
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* "Add Media" Button, only shows if there's space */}
            {media.length < 3 && (
              <View className="w-1/3 p-1">
                <TouchableOpacity
                  onPress={pickMedia}
                  className="w-full h-24 rounded-lg border-2 border-dashed border-gray-300 items-center justify-center bg-gray-50"
                >
                  {loading ? <ActivityIndicator color="#F47C25" /> : <Ionicons name="camera" size={32} color="#9ca3af" />}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* --- Location Information Section --- */}
        <View className="bg-white p-4 rounded-2xl shadow-sm flex-row items-center space-x-3">
          <Ionicons name="location-sharp" size={28} color="#F47C25" />
          <View>
            <Text className="text-base font-tsemibold text-gray-700">Location</Text>
            {location ? (
              <Text className="text-sm font-tregular text-gray-500">
                {`Lat: ${location.latitude.toFixed(4)}, Lon: ${location.longitude.toFixed(4)}`}
              </Text>
            ) : (
              <Text className="text-sm font-tregular text-gray-400">Fetching location...</Text>
            )}
          </View>
        </View>

        {/* --- Submit Button --- */}
        <View className="mt-10">
          <TouchableOpacity
            onPress={submitReport}
            disabled={!isSubmitEnabled()}
            className={`py-4 rounded-full flex-row items-center justify-center shadow-lg ${isSubmitEnabled() ? "bg-primary" : "bg-gray-400"}`}
          >
            {submitting ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="send" size={20} color="white" />}
            <Text className="text-white text-lg font-tbold ml-3">{submitting ? "Submitting..." : "Submit Report"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
