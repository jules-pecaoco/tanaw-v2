// components/SearchComponent.jsx
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

import useSearch from "../../hooks/useSearch";
import useStore from "../../hooks/useStore";

const SearchScreen = () => {
  const { setSearchTerm, suggestions, isLoadingSuggestions, setSelectedPlaceId, selectedPlaceDetails, isLoadingDetails } = useSearch();
  const { recentSearches, setRecentSearches } = useStore();
  const [searchText, setSearchText] = useState("");

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
  };

  const handleRecentSearchSelect = (recentSearch) => {
    setSelectedPlaceId(recentSearch.id);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    saveRecentSearches([]);
  };

  const handleSearchChange = (text) => {
    setSearchText(text);
    setSearchTerm(text);
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
      <View className=" bg-background rounded-full items-center justify-center">
        <Ionicons name="time-outline" size={24} style={{ marginRight: 10 }} color="#secondary" />
      </View>
      <View className="flex-1">
        <Text className="text-secondary font-tmedium text-xl">{item.name}</Text>
        {item.fullName !== item.name && <Text className="text-secondary/60 text-xs mt-1">{item.fullName}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#secondary" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1  p-2 bg-background">
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

        {/* Recent Searches */}
        {recentSearches.length > 0 && suggestions.length === 0 && !isLoadingSuggestions && searchText.length === 0 && (
          <View className="mt-2">
            <View className="flex-row items-center justify-between px-4 py-2 bg-primary/5">
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
    </View>
  );
};

export default SearchScreen;
