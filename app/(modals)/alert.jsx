import { useAudioPlayer } from "expo-audio";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { Text, Vibration, View } from "react-native";
import { alerts } from "../../constants/index";

const typeColors = {
  flood: "#0066cc",
  landslide: "#663300",
  earthquake: "#cc0000",
  fire: "#ff4500",
  storm: "#444477",
  default: "#222",
};

// Different vibration patterns for different alert types
const vibrationPatterns = {
  flood: [0, 1000, 500, 1000, 500, 1000], // Long pulses
  landslide: [0, 300, 200, 300, 200, 300, 200, 300], // Quick bursts
  earthquake: [0, 100, 50, 100, 50, 100, 50, 100, 50, 100], // Rapid shaking
  fire: [0, 500, 100, 500, 100, 500], // Urgent pattern
  storm: [0, 800, 400, 800, 400, 800], // Rolling pattern
  default: [0, 500, 500, 500, 500, 500], // Standard pattern
};

const AlertScreen = () => {
  const { title, body, type } = useLocalSearchParams();
  const bgColor = typeColors[type?.toLowerCase?.()] || typeColors.default;
  console.log("AlertScreen params:", { title, body, type });

  const key = `alert_sound_${type?.toLowerCase?.()}`;
  const soundFile = alerts[key];
  const player = useAudioPlayer(soundFile);

  // Vibration interval ref
  const vibrationInterval = useRef(null);

  // Start vibration with pattern
  const startVibration = () => {
    const pattern = vibrationPatterns[type?.toLowerCase?.()] || vibrationPatterns.default;

    // Start immediate vibration
    Vibration.vibrate(pattern, true); // true for repeat

    // Set up interval for continuous vibration (in case pattern doesn't repeat properly)
    vibrationInterval.current = setInterval(() => {
      Vibration.vibrate(pattern, true);
    }, 5000); // Repeat every 5 seconds
  };

  // Stop vibration
  const stopVibration = () => {
    Vibration.cancel();
    if (vibrationInterval.current) {
      clearInterval(vibrationInterval.current);
    }
  };

  useEffect(() => {
    const play = () => {
      player.seekTo(0);
      player.play();
    };

    // Start audio
    play();

    // Start vibration
    startVibration();

    // Cleanup function
    return () => {
      stopVibration();
    };
  }, [type]);

  // Stop vibration when component unmounts
  useEffect(() => {
    return () => {
      stopVibration();
    };
  }, []);

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: bgColor }}>
      <Text className="text-white text-4xl font-tbold mb-4 text-center">{title}</Text>
      <Text className="text-white text-lg text-center">{body}</Text>
    </View>
  );
};

export default AlertScreen;
