// hooks/useSearch.js
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import useStore from "./useStore";

import { fetchDirections, searchCityDetails, searchCitySuggestions } from "../services/search";

/**
 *.
 * @param {object} userLocation - The user's current location {latitude, longitude}.
 * @param {string} sessionToken - A unique session token for Mapbox Search.
 */
const useSearch = () => {
  const { userLocation, userId: sessionToken, setUserLocation, setUserLocationName } = useStore();

  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");

  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["searchSuggestions", searchTerm],
    queryFn: () => searchCitySuggestions(searchTerm, userLocation, sessionToken),
    enabled: searchTerm.length > 2,

    staleTime: 1000 * 60, // 1 minute
  });

  const { data: selectedPlaceDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["placeDetails", selectedPlaceId],
    queryFn: () => searchCityDetails(selectedPlaceId, sessionToken),
    enabled: !!selectedPlaceId,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const getDirections = async (destination) => {
    const directionsQueryKey = ["directions", userLocation, destination];

    const cachedDirections = queryClient.getQueryData(directionsQueryKey);
    if (cachedDirections) {
      console.log("Returning cached directions");
      return cachedDirections;
    }

    const newDirections = await fetchDirections(userLocation, destination);
    queryClient.setQueryData(directionsQueryKey, newDirections);
    return newDirections;
  };
  useEffect(() => {
    if (selectedPlaceDetails) {
      setUserLocation({
        latitude: selectedPlaceDetails.geometry.coordinates[1],
        longitude: selectedPlaceDetails.geometry.coordinates[0],
      });
      setUserLocationName(selectedPlaceDetails.properties.name);
    }
  }, [selectedPlaceDetails]);

  return {
    setSearchTerm,
    suggestions: suggestions || [],
    isLoadingSuggestions,

    setSelectedPlaceId,
    selectedPlaceDetails,
    isLoadingDetails,

    getDirections,
  };
};

export default useSearch;
