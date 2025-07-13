import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "Tanaw",
  slug: "tanaw-v2",
  version: "0.7.0",
  orientation: "portrait",
  icon: "./assets/images/logo_app.png",
  scheme: "tanaw",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    package: "com.catalyst.tanaw",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo_app.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON,
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/logo_1024px.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#ffffff",
        image: "./assets/images/logo_1024px.png",
        resizeMode: "contain",
        dark: {
          image: "./assets/images/logo_1024px.png",
          backgroundColor: "#000000",
        },
        imageWidth: 200,
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/images/logo_notification.png",
        color: "#F47C25",
        defaultChannel: "default",
        sounds: ["./assets/sounds/notification/notification_sound.wav"],
        enableBackgroundRemoteNotifications: false,
      },
    ],
    ["expo-audio"],
    [
      "expo-location",
      {
        locationAlwaysAndWhenInUsePermission: "Allow Tanaw to use your location to show local weather and alerts.",
        locationWhenInUsePermission: "Allow Tanaw to use your location to show local weather and alerts.",
      },
    ],
    [
      "@rnmapbox/maps",
      {
        RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_SECRET_TOKEN,
      },
    ],
    ["react-native-compressor"]
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
