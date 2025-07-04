import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const BouncingButton = ({ children, ...props }) => {
  // 1. Create a shared value for the scale. Starts at 1 (normal size).
  const scale = useSharedValue(1);

  // 2. Define the animated style that will react to changes in the scale value.
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // 3. Define the press handlers
  const handlePressIn = () => {
    // Use a spring animation to make it shrink and bounce.
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    // Spring back to the original size.
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} {...props}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

export default BouncingButton;
