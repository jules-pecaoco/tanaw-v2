import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import storage from "../persistence/user-settings";

const useStore = create(
  persist(
    (set, get) => ({
      // DEFAULT VALUES
      userLocation: { latitude: 10.653126963455296, longitude: 122.93849508523817 },

      isMapCentered: true,

      // USER NOTIFICATION LOCATION
      userNotificationLoation: { latitude: 10.653126963455296, longitude: 122.93849508523817 },

      // UI STATE
      facilityBottomSheetData: null,

      showMenu: false,
      openGroups: {
        hazard: {},
        weather: null,
      },
      visibleLayers: {
        hazard: {},
        weather: null,
      },
      currentTileUrlTemplate: null,

      // Actions
      setUserLocation: (location) => set({ userLocation: location }),
      setIsMapCentered: (isCentered) => set({ isMapCentered: isCentered }),
      setUserNotificationLocation: (location) => set({ userNotificationLoation: location }),

      toggleMenu: () => set((state) => ({ showMenu: !state.showMenu })),

      toggleGroup: (groupId, isCascade = true) =>
        set((state) => {
          if (isCascade) {
            return {
              openGroups: {
                ...state.openGroups,
                hazard: {
                  ...state.openGroups.hazard,
                  [groupId]: !state.openGroups.hazard?.[groupId],
                },
              },
            };
          } else {
            return {
              openGroups: {
                ...state.openGroups,
                weather: state.openGroups.weather === groupId ? null : groupId,
              },
            };
          }
        }),

      toggleLayer: (groupId, layerId, isCascade = true, layer = null) =>
        set((state) => {
          if (isCascade) {
            const layerKey = `${groupId}_${layerId}`;
            return {
              visibleLayers: {
                ...state.visibleLayers,
                hazard: {
                  ...state.visibleLayers.hazard,
                  [layerKey]: !state.visibleLayers.hazard?.[layerKey],
                },
              },
            };
          } else {
            const layerKey = `${groupId}_${layerId}`;

            return {
              visibleLayers: {
                ...state.visibleLayers,
                weather: state.visibleLayers.weather === layerKey ? null : layerKey,
              },
              currentTileUrlTemplate:
                typeof layer.tilesetUrl === "string" ? layer.tilesetUrl + Math.floor(Date.now() / 1000) : layer.tilesetUrl[layer.maxFutureCast],
            };
          }
        }),
      setCurrentTileUrlTemplate: (url) => set({ currentTileUrlTemplate: url }),

      setFacilityBottomSheetData: (data) => set({ facilityBottomSheetData: data }),
    }),
    {
      name: "settings-preference",
      storage: createJSONStorage(() => storage),
    }
  )
);

export default useStore;
