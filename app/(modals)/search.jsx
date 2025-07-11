import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import useLocation from "../../hooks/useLocation";
import useSearch from "../../hooks/useSearch";
import useStore from "../../hooks/useStore";

const SearchScreen = () => {
  const { setSearchTerm, suggestions, isLoadingSuggestions, setSelectedPlaceId, selectedPlaceDetails, isLoadingDetails } = useSearch();
  const { getCurrentLocation, getReverseGeocode } = useLocation();
  const { recentSearches, setRecentSearches, setUserLocationNotification } = useStore();
  const [searchText, setSearchText] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationRetrieved, setLocationRetrieved] = useState(false);
  const [currentLocationData, setCurrentLocationData] = useState(null);

  // Modal state
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [selectedLocationForNotification, setSelectedLocationForNotification] = useState(null);

  const saveRecentSearches = async (searches) => {
    try {
      setRecentSearches(searches);
    } catch (error) {}
  };

  const handleSelectSuggestion = (place) => {
    setSelectedPlaceId(place.mapbox_id);

    const newSearch = {
      id: place.mapbox_id,
      name: place.name,
      fullName: place.full_name || place.name,
      timestamp: new Date().toISOString(),
    };

    const updatedRecentSearches = [newSearch, ...recentSearches.filter((item) => item.id !== place.mapbox_id)].slice(0, 5); // Keep only 5 most recent

    setRecentSearches(updatedRecentSearches);
    saveRecentSearches(updatedRecentSearches);

    setSearchText("");
    setSearchTerm("");

    setSelectedLocationForNotification(newSearch);
    setShowNotificationModal(true);
  };

  const handleRecentSearchSelect = (recentSearch) => {
    setSelectedPlaceId(recentSearch.id);

    // Show notification modal for recent search selection too
    setSelectedLocationForNotification(recentSearch);
    setShowNotificationModal(true);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    setSearchTerm(text);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);
      const location = await getCurrentLocation();

      if (location) {

        setLocationRetrieved(true);
        setCurrentLocationData(location);

        const currentLocationForNotification = {
          id: "current_location",
          name: "Current Location",
          fullName: `Your current location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        };
        await getReverseGeocode(location);
        setSelectedLocationForNotification(currentLocationForNotification);
        setShowNotificationModal(true);
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      setLocationRetrieved(false);
      setCurrentLocationData(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleNotificationResponse = (enableNotifications) => {
    if (selectedLocationForNotification) {
      const location = {
        latitude: selectedPlaceDetails?.properties?.coordinates?.latitude || selectedLocationForNotification?.coordinates?.latitude,
        longitude: selectedPlaceDetails?.properties?.coordinates?.latitude || selectedLocationForNotification?.coordinates?.longitude,
      };

      if (enableNotifications) {
        setUserLocationNotification(location);
      }
    }

    setShowNotificationModal(false);
    setSelectedLocationForNotification(null);
  };

  const renderSuggestionItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleSelectSuggestion(item)}
      className="bg-background border-b border-secondary/20 px-4 py-4 flex-row items-center active:bg-primary/10"
    >
      <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center mr-3">
        <Ionicons name="location-outline" size={16} color="#primary" />
      </View>
      <View className="flex-1">
        <Text className="text-primary font-tmedium text-base">{item.name}</Text>
        {item.full_name && <Text className="text-secondary/70 text-sm mt-1">{item.full_name}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#secondary" />
    </TouchableOpacity>
  );

  const renderRecentSearchItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleRecentSearchSelect(item)}
      className="bg-background border-b border-secondary/10 px-4 py-3 flex-row items-center active:bg-primary/10"
    >
      <View className="bg-background rounded-full items-center justify-center">
        <Ionicons name="time-outline" size={24} style={{ marginRight: 10 }} color="#secondary" />
      </View>
      <View className="flex-1">
        <Text className="text-secondary font-tmedium text-xl">{item.name}</Text>
        {item.fullName !== item.name && <Text className="text-secondary/60 text-xs mt-1">{item.fullName}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#secondary" />
    </TouchableOpacity>
  );

  const NotificationModal = () => (
    <Modal visible={showNotificationModal} transparent animationType="fade" onRequestClose={() => setShowNotificationModal(false)}>
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-background rounded-2xl mx-6 p-6 shadow-lg">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-primary/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="notifications-outline" size={32} color="#primary" />
            </View>
            <Text className="text-primary text-xl font-tbold text-center">Location Notifications</Text>
          </View>

          {/* Content */}
          <View className="mb-6">
            <Text className="text-secondary text-base text-center mb-4">Would you like to receive weather alerts and notifications for</Text>
            <View className="bg-primary/5 rounded-lg p-3 mb-4">
              <Text className="text-primary font-tmedium text-center">{selectedLocationForNotification?.name}</Text>
              {selectedLocationForNotification?.fullName !== selectedLocationForNotification?.name && (
                <Text className="text-secondary/70 text-sm text-center mt-1">{selectedLocationForNotification?.fullName}</Text>
              )}
            </View>
            <Text className="text-secondary/70 text-sm text-center">
              You'll get timely updates about weather conditions, warnings, and forecasts for this location.
            </Text>
          </View>

          {/* Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => handleNotificationResponse(false)}
              className="flex-1 bg-secondary/10 rounded-full py-3 px-4 active:bg-secondary/20"
            >
              <Text className="text-secondary font-tmedium text-center">Not Now</Text>
            </TouchableOpacity>
            <View className="px-2"></View>
            <TouchableOpacity
              onPress={() => handleNotificationResponse(true)}
              className="flex-1 bg-primary rounded-full py-3 px-4 active:bg-primary/90"
            >
              <Text className="text-white font-tmedium text-center">Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View className="flex-1 p-2 bg-background">
      {/* Search Header */}
      <View className="bg-background rounded-full px-4">
        {/* Search Input */}
        <View className="relative flex-row items-center w-full">
          <View className="absolute z-10 left-2">
            <Ionicons name="search" size={20} color="#secondary" />
          </View>
          <TextInput
            className="bg-background w-full border rounded-full px-10"
            placeholder="Search for a city..."
            placeholderTextColor="#secondary"
            value={searchText}
            onChangeText={handleSearchChange}
            autoCorrect={false}
            autoCapitalize="words"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearchChange("")} className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Ionicons name="close-circle" size={20} color="#secondary" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Current Location Button */}
      <TouchableOpacity
        onPress={handleGetCurrentLocation}
        disabled={isGettingLocation}
        className="bg-primary/10 border border-primary/20 rounded-full mx-4 mt-3 py-3 px-4 flex-row items-center justify-center active:bg-primary/20"
      >
        {isGettingLocation ? <ActivityIndicator size="small" color="#primary" /> : <Ionicons name="locate" size={20} color="#primary" />}
        <Text className="text-primary font-tmedium text-base ml-2">{isGettingLocation ? "Getting location..." : "Use Current Location"}</Text>
      </TouchableOpacity>

      {/* Content Area */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Loading Suggestions */}
        {isLoadingSuggestions && (
          <View className="px-4 py-6 items-center">
            <ActivityIndicator size="large" color="#primary" />
            <Text className="text-secondary text-sm mt-2">Searching...</Text>
          </View>
        )}

        {/* Suggestions List */}
        {suggestions.length > 0 && !isLoadingSuggestions && (
          <View className="mt-2">
            <Text className="text-secondary text-sm font-tmedium px-4 py-2 bg-primary/5">SUGGESTIONS</Text>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.mapbox_id}
              renderItem={renderSuggestionItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Location Retrieved Message */}
        {locationRetrieved && currentLocationData && (
          <View className="mx-4 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <View className="flex-row items-center">
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
              <Text className="text-green-800 font-tmedium ml-2">Location Retrieved Successfully</Text>
            </View>
            <Text className="text-green-700 text-sm mt-1">
              Coordinates: {currentLocationData.latitude.toFixed(4)}, {currentLocationData.longitude.toFixed(4)}
            </Text>
          </View>
        )}

        {/* Recent Searches */}
        {recentSearches.length > 0 && suggestions.length === 0 && !isLoadingSuggestions && searchText.length === 0 && (
          <View className="mt-2">
            <View className="flex-row items-center justify-between px-4 py-2">
              <Text className="text-secondary text-sm font-tmedium">RECENT SEARCHES</Text>
              <TouchableOpacity onPress={clearRecentSearches}>
                <Text className="text-primary text-sm font-tmedium">Clear</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentSearches}
              keyExtractor={(item) => item.id}
              renderItem={renderRecentSearchItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Selected Place Details */}
        {isLoadingDetails && (
          <View className="mx-4 mt-6 p-6 bg-background rounded-xl border border-primary/20">
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#primary" />
              <Text className="text-primary text-base ml-3">Loading details...</Text>
            </View>
          </View>
        )}

        {selectedPlaceDetails && !isLoadingDetails && (
          <View className="mx-4 mt-6 p-6 bg-background rounded-xl border border-primary/20">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-4">
                <Ionicons name="location" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-lg font-tbold">{selectedPlaceDetails.properties.name}</Text>
                <Text className="text-secondary text-sm">Selected Location</Text>
              </View>
            </View>

            {/* Additional Details */}
            <View className="space-y-2">
              {selectedPlaceDetails.properties.full_name && (
                <View className="flex-row items-center">
                  <Ionicons name="map-outline" size={16} color="#secondary" />
                  <Text className="text-secondary text-sm ml-2">{selectedPlaceDetails.properties.full_name}</Text>
                </View>
              )}

              {selectedPlaceDetails.properties.coordinates && (
                <View className="flex-row items-center">
                  <Ionicons name="compass-outline" size={16} color="#secondary" />
                  <Text className="text-secondary text-sm ml-2">
                    {selectedPlaceDetails.properties.coordinates.latitude.toFixed(4)},{" "}
                    {selectedPlaceDetails.properties.coordinates.longitude.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Empty State */}
        {suggestions.length === 0 && !isLoadingSuggestions && searchText.length > 0 && (
          <View className="px-4 py-12 items-center">
            <View className="w-16 h-16 bg-background rounded-full items-center justify-center mb-4">
              <Ionicons name="search" size={32} color="#secondary" />
            </View>
            <Text className="text-primary text-lg font-tmedium mb-2">No cities found</Text>
            <Text className="text-secondary text-sm text-center">Try searching with a different spelling or check if the city name is correct</Text>
          </View>
        )}

        {/* Welcome State */}
        {suggestions.length === 0 && !isLoadingSuggestions && searchText.length === 0 && recentSearches.length === 0 && (
          <View className="px-4 py-12 items-center">
            <View className="w-20 h-20 bg-background rounded-full items-center justify-center mb-6">
              <Ionicons name="earth" size={40} color="#primary" />
            </View>
            <Text className="text-primary text-xl font-tbold mb-2">Search Cities</Text>
            <Text className="text-secondary text-sm text-center max-w-xs">Search for any city around the Negros Island and more*...</Text>
          </View>
        )}
      </ScrollView>

      {/* Notification Modal */}
      <NotificationModal />
    </View>
  );
};

export default SearchScreen;
