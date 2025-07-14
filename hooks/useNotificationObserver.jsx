import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

const useNotificationObserver = () => {
  const lastNotificationIdRef = useRef(null);

  useEffect(() => {
    const handleNotification = (notification) => {
      const { title, body, data } = notification.request.content;

      const type = data?.type ?? "advisory";
      const hazard = data?.hazard ?? "general";

      const uniqueId = data?.id || `${title}-${body}-${type}`;

      if (type === "alert" && lastNotificationIdRef.current === uniqueId) {
        return;
      }

      if (type === "alert") {
        lastNotificationIdRef.current = uniqueId;

        router.push({
          pathname: "alert",
          params: { title, body, type: hazard },
        });
      } else if (type === "advisory") {
        console.log("Weather Advisory received:", title);
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
};

export default useNotificationObserver;
