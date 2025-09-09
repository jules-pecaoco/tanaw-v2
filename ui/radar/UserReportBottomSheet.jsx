import { Ionicons } from "@expo/vector-icons";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { forwardRef, useMemo, useRef, useState } from "react";
import { FlatList, Image, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";

import useStore from "../../hooks/useStore";

/**
 * A BottomSheet component that displays the details of a user-submitted hazard report.
 * Features an enhanced full-width, horizontally pannable image gallery with dot indicators.
 */
const UserReportBottomSheet = forwardRef(({ close }, ref) => {
  const { selectedUserReport } = useStore();
  const snapPoints = useMemo(() => ["50%", "60%"], []);

  // State and Hooks for Enhanced Gallery
  const { width: screenWidth } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 100,
  }).current;

  // Enhanced scroll handler
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  // Filter for valid image paths
  const validMediaPaths = useMemo(
    () => selectedUserReport?.media_path?.filter((path) => typeof path === "string" && path.length > 0) || [],
    [selectedUserReport]
  );

  // Calculate image dimensions
  const imageWidth = screenWidth - 32;
  const imageHeight = imageWidth / 1.77;

  // Enhanced image renderer with loading state
  const renderImage = ({ item: imageUrl, index }) => (
    <View style={{ width: imageWidth }} className="items-center">
      <Image
        source={{ uri: imageUrl }}
        style={{ width: imageWidth, height: imageHeight }}
        className="rounded-lg bg-gray-200"
        resizeMode="cover"
        onError={() => console.warn(`Failed to load image: ${imageUrl}`)}
      />
    </View>
  );

  // Dot indicator component
  const renderDotIndicator = () => (
    <View className="flex-row justify-center items-center mt-3 mb-2">
      {validMediaPaths.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => {
            flatListRef.current?.scrollToIndex({ index, animated: true });
            setActiveIndex(index);
          }}
          className={`w-2 h-2 rounded-full mx-1 ${index === activeIndex ? "bg-blue-500" : "bg-gray-300"}`}
        />
      ))}
    </View>
  );

  // Alternative: ScrollView implementation (uncomment to use instead of FlatList)
  const ScrollViewGallery = () => {
    const scrollViewRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(0);

    const onScroll = (event) => {
      const slideSize = event.nativeEvent.layoutMeasurement.width;
      const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
      setCurrentPage(index);
    };

    return (
      <View>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {validMediaPaths.map((imageUrl, index) => (
            <View key={`${imageUrl}-${index}`} style={{ width: imageWidth, marginRight: index < validMediaPaths.length - 1 ? 16 : 0 }}>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: imageWidth, height: imageHeight }}
                className="rounded-lg bg-gray-200"
                resizeMode="cover"
              />
            </View>
          ))}
        </ScrollView>

        {/* Page indicator for ScrollView */}
        <View className="flex-row justify-center items-center mt-3">
          {validMediaPaths.map((_, index) => (
            <View key={index} className={`w-2 h-2 rounded-full mx-1 ${index === currentPage ? "bg-blue-500" : "bg-gray-300"}`} />
          ))}
        </View>

        <Text className="text-center font-tsemibold text-gray-500 mt-2">
          {currentPage + 1} / {validMediaPaths.length}
        </Text>
      </View>
    );
  };

  return (
    <BottomSheet
      ref={ref}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      backgroundStyle={{ backgroundColor: "transparent" }}
      detached={true}
      handleComponent={() => (
        <View className="flex-row items-center justify-between rounded-t-xl p-4 bg-background">
          <Text className="text-lg font-tmedium text-secondary">Report Details</Text>
          <TouchableOpacity onPress={close}>
            <Ionicons name="close" size={24} className="text-secondary" />
          </TouchableOpacity>
        </View>
      )}
      style={{ elevation: 5, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 5, zIndex: 1000 }}
    >
      <BottomSheetView style={{ flex: 1, backgroundColor: "#fffcfa" }}>
        {!selectedUserReport ? (
          <View className="flex-1 items-center justify-center">
            <Text className="font-tregular text-gray-500">Select a report to view details.</Text>
          </View>
        ) : (
          <View className="flex-1">
            {/* Main Title */}
            <View className="px-4 pt-4">
              <Text className="text-2xl font-tbold mb-1 text-secondary">{selectedUserReport.type || "User Report"}</Text>
              <Text className="text-sm font-tregular text-gray-500">{selectedUserReport.location_name}</Text>
            </View>

            {/* Enhanced Image Gallery with FlatList */}
            {validMediaPaths.length > 0 && (
              <View className="mt-4">
                <FlatList
                  ref={flatListRef}
                  data={validMediaPaths}
                  renderItem={renderImage}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                  ItemSeparatorComponent={() => <View className="w-4" />}
                  getItemLayout={(data, index) => ({
                    length: imageWidth + 16, // width + separator
                    offset: (imageWidth + 16) * index,
                    index,
                  })}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={3}
                  windowSize={5}
                />

                {/* Dot Indicator */}
                {validMediaPaths.length > 1 && renderDotIndicator()}

                {/* Page Counter */}
                <Text className="text-center font-tsemibold text-gray-500 mt-1">
                  {activeIndex + 1} / {validMediaPaths.length}
                </Text>

                {/* Navigation Arrows (Optional) */}
                {validMediaPaths.length > 1 && (
                  <View className="flex-row justify-between items-center px-4 mt-2">
                    <TouchableOpacity
                      onPress={() => {
                        const prevIndex = activeIndex > 0 ? activeIndex - 1 : validMediaPaths.length - 1;
                        flatListRef.current?.scrollToIndex({ index: prevIndex, animated: true });
                      }}
                      className="p-2 bg-gray-100 rounded-full"
                      disabled={validMediaPaths.length <= 1}
                    >
                      <Ionicons name="chevron-back" size={20} color="#666" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        const nextIndex = activeIndex < validMediaPaths.length - 1 ? activeIndex + 1 : 0;
                        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
                      }}
                      className="p-2 bg-gray-100 rounded-full"
                      disabled={validMediaPaths.length <= 1}
                    >
                      <Ionicons name="chevron-forward" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Details Section */}
            <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 8 }}>
              {selectedUserReport.description && (
                <View>
                  <Text className="font-tsemibold text-gray-500">Description</Text>
                  <Text className="font-tregular text-secondary text-base leading-snug">{selectedUserReport.description}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </BottomSheetView>
    </BottomSheet>
  );
});

export default UserReportBottomSheet;
