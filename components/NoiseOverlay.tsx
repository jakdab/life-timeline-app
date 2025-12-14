import React from "react";
import { StyleSheet, View, Image, Dimensions } from "react-native";

interface NoiseOverlayProps {
  opacity?: number;
  patternScale?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Global noise overlay component that adds a subtle film grain effect.
 * Uses pointerEvents="none" so it doesn't block any interactions.
 * 
 * Settings from Figma:
 * - Opacity: 30%
 * - Blend mode: Multiply (supported in React Native 0.77+)
 * - Scale pattern: configured via patternScale prop
 */
const NoiseOverlay: React.FC<NoiseOverlayProps> = ({ 
  opacity = 0.35,
  patternScale = 1.5 
}) => {
  // Scale factor determines how large to make the image to compensate for scaling
  const scaleFactor = 1 / patternScale;

  return (
    <View 
      style={[
        styles.container, 
        // Apply mixBlendMode to the container View
        { mixBlendMode: "multiply" } as any
      ]} 
      pointerEvents="none"
    >
      <View 
        style={[
          styles.scaleContainer,
          { transform: [{ scale: patternScale }] }
        ]}
      >
        <Image
          source={require("../assets/images/noise-texture.png")}
          style={[
            styles.noiseImage,
            { 
              opacity,
              width: SCREEN_WIDTH * scaleFactor,
              height: SCREEN_HEIGHT * scaleFactor,
            },
          ]}
          resizeMode="repeat"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    overflow: "hidden",
  },
  scaleContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    transformOrigin: "top left",
  },
  noiseImage: {
    // Size is set dynamically based on scale
  },
});

export default NoiseOverlay;
