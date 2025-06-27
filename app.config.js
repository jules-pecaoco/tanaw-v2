import "dotenv/config";
export default ({ config }) => ({
  ...config,
  name: "Tanaw",
  slug: "tanaw-v2",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/logo-1024px.png",
  scheme: "tanaw",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/logo-1024px.png",
        resizeMode: "contain",
        dark: {
          image: "./assets/images/logo-1024px.png",
          backgroundColor: "#000000",
        },
        imageWidth: 200,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/logo-notification.png",
        color: "#ffffff",
        defaultChannel: "default",
        sounds: ["./assets/notification-sound.wav"],
        enableBackgroundRemoteNotifications: false,
      },
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.MAPBOX_SECRET_TOKEN,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: "7e73159c-3eba-450b-81ee-95d751b1bb4c",
    },
  },
  owner: "jules-pecaoco",
});
