import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import storage from "../persistence/user-settings";

const useStore = create(
  persist(
    (set, get) => ({
      // DEFAULT VALUES
      userLocation: { latitude: 10.653126963455296, longitude: 122.93849508523817 },
      setUserLocation: (location) => set({ userLocation: location }),

      isMapCentered: true,
      setIsMapCentered: (isCentered) => set({ isMapCentered: isCentered }),

      // USER NOTIFICATION LOCATION
      userNotificationLoation: { latitude: 10.653126963455296, longitude: 122.93849508523817 },
      setUserNotificationLocation: (location) => set({ userNotificationLoation: location }),

      showMenu: false,
      openGroups: {},
      visibleLayers: {},

      // Actions
      toggleMenu: () => set((state) => ({ showMenu: !state.showMenu })),

      toggleGroup: (groupId) =>
        set((state) => ({
          openGroups: {
            ...state.openGroups,
            [groupId]: !state.openGroups[groupId],
          },
        })),

      toggleLayer: (groupId, layerId) =>
        set((state) => {
          const layerKey = `${groupId}_${layerId}`;
          return {
            visibleLayers: {
              ...state.visibleLayers,
              [layerKey]: !state.visibleLayers[layerKey],
            },
          };
        }),
    }),
    {
      name: "settings-preference",
      storage: createJSONStorage(() => storage),
    }
  )
);

export default useStore;
