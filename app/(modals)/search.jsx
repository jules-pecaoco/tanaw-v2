import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import useLocation from "../../hooks/useLocation";
import useSearch from "../../hooks/useSearch";
import useStore from "../../hooks/useStore";

const SearchScreen = () => {
  const { setSearchTerm, suggestions, isLoadingSuggestions, setSelectedPlaceId, selectedPlaceDetails, isLoadingDetails } = useSearch();
  const { getCurrentLocation, getReverseGeocode } = useLocation();
  const { recentSearches, setRecentSearches, setUserLocationNotification, setUserLocation } = useStore();
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

    const updatedRecentSearches = [newSearch, ...recentSearches.filter((item) => item.id !== place.mapbox_id)].slice(0, 5);

    setRecentSearches(updatedRecentSearches);
    saveRecentSearches(updatedRecentSearches);

    setSearchText("");
    setSearchTerm("");

    setSelectedLocationForNotification(newSearch);
    setShowNotificationModal(true);
  };

  const handleRecentSearchSelect = (recentSearch) => {
    setSelectedPlaceId(recentSearch.id);

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
      setLocationRetrieved(false);
      setCurrentLocationData(null);

      const location = await getCurrentLocation();

      if (location) {
        setLocationRetrieved(true);
        setCurrentLocationData(location);

        // Get reverse geocoding to get a readable address
        const reverseGeocode = await getReverseGeocode(location);

        // Create a current location object similar to other selections
        const currentLocationForNotification = {
          id: "current_location",
          name: "Current Location",
          fullName: reverseGeocode?.formatted || `Current Location (${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)})`,
          timestamp: new Date().toISOString(),
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
        };

        setSelectedLocationForNotification(currentLocationForNotification);
        setShowNotificationModal(true);
      }
    } catch (error) {
      setLocationRetrieved(false);
      setCurrentLocationData(null);
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleNotificationResponse = async (enableNotifications) => {
    if (selectedLocationForNotification) {
      let location;

      if (selectedLocationForNotification.id === "current_location") {
        location = {
          latitude: selectedLocationForNotification.coordinates.latitude,
          longitude: selectedLocationForNotification.coordinates.longitude,
        };
        setUserLocation(location);
        const reverseGeocode = await getReverseGeocode(location);
      } else {
        // Handle regular place selection coordinates
        location = {
          latitude: selectedPlaceDetails?.properties?.coordinates?.latitude || selectedLocationForNotification?.coordinates?.latitude,
          longitude: selectedPlaceDetails?.properties?.coordinates?.longitude || selectedLocationForNotification?.coordinates?.longitude, // Fixed: was using latitude twice
        };
      }

      if (enableNotifications) {
        setUserLocationNotification(location);
      }
    }

    setShowNotificationModal(false);
    setSelectedLocationForNotification(null);
  };

  const renderSuggestionItem = ({ item }) => {
    const distance = item.distance ? `${(item.distance / 1000).toFixed(1)} km` : null;

    const category = item.poi_category?.[0]?.replace(/_/g, " ") || item.feature_type;

    return (
      <TouchableOpacity
        onPress={() => handleSelectSuggestion(item)}
        className="bg-background border-b border-secondary/20 px-4 py-4 flex-row items-center active:bg-primary/10"
      >
        <View className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center mr-3">
          <Ionicons name={getIconName(item.maki, item.feature_type)} size={20} color="#F47C25" />
        </View>

        <View className="flex-1">
          {/* Name and category */}
          <View className="flex-row items-center mb-1">
            <Text className="text-primary font-tmedium text-base flex-1">{item.name}</Text>
            {distance && <Text className="text-green-600 text-xs font-tmedium ml-2">{distance}</Text>}
          </View>

          {/* Address line */}
          <Text className="text-secondary/70 text-sm mb-1" numberOfLines={1}>
            {item.address || item.place_formatted}
          </Text>

          {/* Category badge */}
          <View className="self-start bg-primary/10 rounded-full px-2 py-0.5">
            <Text className="text-primary text-xs capitalize">{category}</Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#secondary" />
      </TouchableOpacity>
    );
  };

  const getIconName = (maki, featureType) => {
    if (maki === "building") return "business";
    if (featureType === "poi") return "star";
    if (featureType === "address") return "pin";
    return "location-outline";
  };

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
            placeholder="Search for a barangay or city" 
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

        {/* Current Location Details - Similar to Selected Place Details */}
        {locationRetrieved && currentLocationData && (
          <View className="mx-4 mt-6 p-6 bg-background rounded-xl border border-primary/20">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-4">
                <Ionicons name="locate" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-primary text-lg font-tbold">Current Location</Text>
                <Text className="text-secondary text-sm">Your current position</Text>
              </View>
            </View>

            {/* Location Details */}
            <View className="space-y-2">
              <View className="flex-row items-center">
                <Ionicons name="compass-outline" size={16} color="#secondary" />
                <Text className="text-secondary text-sm ml-2">
                  {currentLocationData.latitude.toFixed(4)}, {currentLocationData.longitude.toFixed(4)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text className="text-green-800 text-sm ml-2">Location retrieved successfully</Text>
              </View>
            </View>
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
        {suggestions.length === 0 && !isLoadingSuggestions && searchText.length === 0 && recentSearches.length === 0 && !locationRetrieved && (
          <View className="px-4 py-12 items-center">
            <View className="w-20 h-20 bg-background rounded-full items-center justify-center mb-6">
              <Ionicons name="earth" size={40} color="#primary" />
            </View>
            <Text className="text-primary text-xl font-tbold mb-2">Search Places</Text>
            <Text className="text-secondary text-sm text-center max-w-xs">Search for barangays, municipalities, and cities in the Philippines</Text>
          </View>
        )}
      </ScrollView>

      {/* Notification Modal */}
      <NotificationModal />
    </View>
  );
};

export default SearchScreen;
