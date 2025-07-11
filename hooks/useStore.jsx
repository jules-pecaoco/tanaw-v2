import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import storage from "../persistence/user-settings";

const useStore = create(
  persist(
    (set, get) => ({
      // DEFAULT VALUES
      // unique identifier
      userId: null,
      // push token
      userExpoToken: null,
      // user location
      userLocation: {
        latitude: 10.657643611417026,
        longitude: 122.9481023926049,
      },
      //user location for notifations
      userLocationNotification: {},
      // user location name
      userLocationName: "Bacolod City",
      //facility destination
      facilityDirection: {},

      // SEARCHES
      recentSearches: [],

      // UI STATE
      currentTileUrlTemplate: null,
      facilityBottomSheetData: null,
      facilityDestination: {},
      isMapCentered: true,

      showMenu: false,
      openGroups: {
        hazard: {},
        weather: null,
      },
      visibleLayers: {
        hazard: {},
        weather: null,
      },

      // Actions
      setUserLocation: (location) => set({ userLocation: location }),
      setUserId: (userId) => set({ userId }),
      setUserExpoToken: (expoToken) => set({ userExpoToken: expoToken }),
      setUserLocationNotification: (location) => set({ userLocationNotification: location }),
      setUserLocationName: (name) => set({ userLocationName: name }),

      setFacilityDirection: (direction) => set({ facilityDirection: direction }),

      // SEARCHES
      setRecentSearches: (searches) => set({ recentSearches: searches }),

      setCurrentTileUrlTemplate: (url) => set({ currentTileUrlTemplate: url }),
      setFacilityBottomSheetData: (data) => set({ facilityBottomSheetData: data }),

      setIsMapCentered: (isCentered) => set({ isMapCentered: isCentered }),

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
    }),
    {
      name: "settings-preference",
      storage: createJSONStorage(() => storage),
    }
  )
);

export default useStore;
