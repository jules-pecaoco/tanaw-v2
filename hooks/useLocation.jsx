import * as Location from "expo-location";
import { useState } from "react";

import { reverseGeocode } from "../services/search";
import useStore from "./useStore";

const useLocation = () => {
  const { userLocation, setUserLocation, setUserLocationName } = useStore();
  const [locationPermission, setLocationPermission] = useState(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const getReverseGeocode = async () => {
    try {
      const locationName = await reverseGeocode(userLocation);
      setUserLocationName(`${locationName.locality},${locationName.city}` || locationName.city || locationName.region || "Unknown Location");
    } catch (error) {
      console.error("Error getting reverse geocode:", error);
      throw error;
    }
  };

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      setIsRequestingLocation(true);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return coordinates;
    } catch (error) {
      console.error("Error requesting location permission:", error);
      throw error;
    } finally {
      setIsRequestingLocation(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        throw new Error("Location permission not granted");
      }

      setIsRequestingLocation(true);

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return coordinates;
    } catch (error) {
      console.error("Error getting current location:", error);
      throw error;
    } finally {
      setIsRequestingLocation(false);
    }
  };

  return {
    locationPermission,
    isRequestingLocation,
    requestLocationPermission,
    getCurrentLocation,
    hasLocationPermission: locationPermission === "granted",
    getReverseGeocode,
  };
};

export default useLocation;
