import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

const useNotificationObserver = () => {
  const lastNotificationIdRef = useRef(null);

  useEffect(() => {
    const handleNotification = (notification) => {
      const { title, body, data } = notification.request.content;

      // Handle both old and new data structures
      const type = data?.type ?? "advisory";
      const hazard = data?.hazard ?? data?.weather_type ?? "general";
      const userId = data?.user_id;
      const timestamp = data?.timestamp;

      // Create unique ID - prefer existing ID, fallback to timestamp + type
      const uniqueId = data?.id || (timestamp ? `${timestamp}-${type}` : `${title}-${body}-${type}`);

      // Prevent duplicate alert handling
      if (type === "alert" && lastNotificationIdRef.current === uniqueId) {
        return;
      }


      if (type === "alert") {
        // Store the ID to prevent duplicates
        lastNotificationIdRef.current = uniqueId;

        // Navigate to alert page with weather-specific data
        router.push({
          pathname: "alert",
          params: {
            title,
            body,
            type: hazard,
            weather_type: data?.weather_type,
            timestamp: timestamp,
            alert_id: uniqueId,
          },
        });
      } else if (type === "notification" || type === "advisory") {
        // Handle general notifications/weather updates
        // You might want to show a toast, update a badge, or store in local state

        // Optional: Show in-app notification or update weather status
        // Example: showInAppNotification({ title, body, type: hazard });
      }
    };

    const notificationListener = Notifications.addNotificationReceivedListener(handleNotification);

    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotification(response.notification);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Optional: Return methods to manually clear or check notification state
  return {
    clearLastNotificationId: () => {
      lastNotificationIdRef.current = null;
    },
    getLastNotificationId: () => lastNotificationIdRef.current,
  };
};

export default useNotificationObserver;
