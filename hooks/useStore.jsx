import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import storage from "../persistence/user-settings";

const useStore = create(
  persist(
    (set, get) => ({
      showMenu: false,
      openGroups: {},
      visibleLayers: {},

      // Actions
      toggleMenu: () => set((state) => ({ showMenu: !state.showMenu })),

      toggleGroup: (groupName) =>
        set((state) => ({
          openGroups: {
            ...state.openGroups,
            [groupName]: !state.openGroups[groupName],
          },
        })),

      toggleLayer: (groupName, layerName) =>
        set((state) => {
          const layerKey = `${groupName}_${layerName}`;
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
