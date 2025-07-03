import "dotenv/config";
export default ({ config }) => ({
  ...config,
  name: "Tanaw",
  slug: "tanaw-v2",
  version: "0.4.0",
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
        color: "#ffffff",
        defaultChannel: "default",
        sounds: ["./assets/sounds/notification/notification_sound.wav"],
        enableBackgroundRemoteNotifications: false,
      },
    ],
    [
      "expo-audio"
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
      projectId: '7e73159c-3eba-450b-81ee-95d751b1bb4c',
    },
    MAPBOX_PUBLIC_KEY: process.env.MAPBOX_PUBLIC_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  owner: "jules-pecaoco",
});
