import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import useStore from "./useStore";

export const useNotification = () => {
  const { userLocation, setUserExpoToken, setUserLocationNotification } = useStore();
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    };
    checkPermissions();
  }, []); 

  /**
   * Asks the user for notification permissions.
   * If granted, it gets the Expo Push Token and updates the global state.
   * @returns {Promise<boolean>} - True if permission was granted, false otherwise.
   */
  const requestPermissionsAndGetToken = useCallback(async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);

      if (status !== "granted") {
        alert("Failed to get push token for push notification!");
        return false;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
      });

      const token = tokenData.data;

      setUserExpoToken(token);
      setUserLocationNotification(userLocation);

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }, [userLocation, setUserExpoToken, setUserLocationNotification]); // Include dependencies

  return {
    permissionStatus,
    requestPermissionsAndGetToken,
  };
};

export default useNotification;
