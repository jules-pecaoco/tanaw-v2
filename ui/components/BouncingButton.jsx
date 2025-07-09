import { Pressable } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const BouncingButton = ({ children, onPressIn, onPressOut, disabled, ...props }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (disabled) return; // Don't animate if disabled
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
    onPressIn?.(); // Call the passed-in handler if it exists
  };

  const handlePressOut = () => {
    if (disabled) return; // Don't animate if disabled
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    onPressOut?.(); // Call the passed-in handler if it exists
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} disabled={disabled} {...props}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </Pressable>
  );
};

export default BouncingButton;
