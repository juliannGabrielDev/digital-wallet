import React, { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia, Group } from '@shopify/react-native-skia';
import { useSharedValue, withRepeat, withTiming, Easing, useDerivedValue } from 'react-native-reanimated';

interface SnakeDividerProps {
  color?: string;
  height?: number;
  strokeWidth?: number;
  frequency?: number;
  width?: number; // Optional, defaults to screen width - padding
  animated?: boolean;
  speed?: number; // duration in ms for one cycle
}

export default function SnakeDivider({
  color = '#52525b', // zinc-600
  height = 24,
  strokeWidth = 3,
  frequency = 8,
  width,
  animated = true,
  speed = 2000,
}: SnakeDividerProps) {
  const { width: screenWidth } = useWindowDimensions();
  // Use provided width, or default to screen width minus some padding
  const actualWidth = width || screenWidth - 48; 
  const segmentWidth = actualWidth / frequency;

  const path = React.useMemo(() => {
    const centerY = height / 2;
    // We leave a little padding so the stroke doesn't get clipped
    const amplitude = (height - strokeWidth) / 2;

    let pathStr = `M 0 ${centerY} `;
    
    // We draw extra segments so that when we translate left, we don't run out of path
    for (let i = 0; i < frequency + 2; i++) {
      const startX = i * segmentWidth;
      const midX = startX + segmentWidth / 2;
      const endX = startX + segmentWidth;
      
      // Quadratic Bezier to the midpoint (curve up)
      pathStr += `Q ${startX + segmentWidth / 4} ${centerY - amplitude}, ${midX} ${centerY} `;
      // Smooth Quadratic Bezier to the endpoint (curve down)
      pathStr += `T ${endX} ${centerY} `;
    }

    const skPath = Skia.Path.MakeFromSVGString(pathStr);
    return skPath;
  }, [actualWidth, height, frequency, strokeWidth]);

  const translateX = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      translateX.value = 0;
      translateX.value = withRepeat(
        withTiming(-segmentWidth, {
          duration: speed,
          easing: Easing.linear,
        }),
        -1, // Infinite
        false // Don't reverse, keep going left
      );
    } else {
      translateX.value = 0;
    }
  }, [animated, speed, segmentWidth]);

  const transform = useDerivedValue(() => {
    return [{ translateX: translateX.value }];
  });

  if (!path) return null;

  return (
    <View style={{ height, width: actualWidth, alignItems: 'center', justifyContent: 'center' }}>
      <Canvas style={{ height, width: actualWidth }}>
        <Group transform={transform}>
          <Path 
            path={path} 
            style="stroke" 
            strokeWidth={strokeWidth} 
            color={color}
            strokeCap="round"
            strokeJoin="round"
          />
        </Group>
      </Canvas>
    </View>
  );
}
