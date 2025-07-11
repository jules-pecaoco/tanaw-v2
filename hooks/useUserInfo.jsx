import { useEffect, useState } from "react";
import upsertUserInfo from "../services/users-info";
import useStore from "./useStore";

const useUserInfo = () => {
  const { userId, userExpoToken, userLocationNotification, userLocation } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const updateUserInfo = async () => {
      setError(null);


      if (!userLocationNotification.latitude || !userLocationNotification.longitude) {
        console.error("Invalid location data:", userLocationNotification);
        setError("Invalid location data");
        return;
      }

      try {
        setIsUpdating(true);

        const data = await upsertUserInfo(userId, userExpoToken, userLocationNotification);

        if (data) {
          setLastUpdated(new Date().toISOString());
        } else {
          setError("Failed to update user info");
        }
      } catch (err) {
        console.error("Error updating user info:", err);
        setError(err.message || "An error occurred while updating user info");
      } finally {
        setIsUpdating(false);
      }
    };

    updateUserInfo();
  }, [userExpoToken, userLocationNotification]);

  return {
    isUpdating,
    lastUpdated,
    error,
  };
};

export default useUserInfo;
