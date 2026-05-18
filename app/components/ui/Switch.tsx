import { useHaptics } from "@/hooks/useHaptics";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, {
	interpolateColor,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";

interface SwitchProps {
	isActive: boolean;
	onToggle: (value: boolean) => void;
}

export default function CustomSwitch({ isActive, onToggle }: SwitchProps) {
	const haptics = useHaptics();

	// Dimensions
	const switchWidth = 80;
	const switchHeight = 48;
	const thumbSize = 40;
	const padding = 4;
	const translateDistance = switchWidth - thumbSize - padding * 2;

	const translateX = useSharedValue(isActive ? translateDistance : 0);

	useEffect(() => {
		translateX.value = withSpring(isActive ? translateDistance : 0, {
			mass: 1,
			damping: 15,
			stiffness: 120,
			overshootClamping: false,
			restDisplacementThreshold: 0.01,
			restSpeedThreshold: 2,
		});
	}, [isActive]);

	const handlePress = () => {
		haptics.light();
		onToggle(!isActive);
	};

	const trackStyle = useAnimatedStyle(() => {
		const backgroundColor = interpolateColor(
			translateX.value,
			[0, translateDistance],
			["#27272a", "#f4f4f5"] // zinc-800 to zinc-100
		);
		return { backgroundColor };
	});

	const thumbStyle = useAnimatedStyle(() => {
		const backgroundColor = interpolateColor(
			translateX.value,
			[0, translateDistance],
			["#52525b", "#18181b"] // zinc-600 to zinc-900
		);
		return {
			transform: [{ translateX: translateX.value }],
			backgroundColor,
		};
	});

	const checkmarkStyle = useAnimatedStyle(() => {
		return {
			opacity: withTiming(isActive ? 1 : 0, { duration: 200 }),
			transform: [{ scale: withSpring(isActive ? 1 : 0) }],
		};
	});

	return (
		<Pressable onPress={handlePress} activeOpacity={0.8}>
			<Animated.View
				style={[
					{
						width: switchWidth,
						height: switchHeight,
						padding,
						borderRadius: switchHeight / 2,
					},
					trackStyle,
				]}
			>
				<Animated.View
					style={[
						{
							width: thumbSize,
							height: thumbSize,
							borderRadius: thumbSize / 2,
							justifyContent: "center",
							alignItems: "center",
						},
						thumbStyle,
					]}
				>
					<Animated.View style={checkmarkStyle}>
						<Ionicons name="checkmark-sharp" size={24} color="#f4f4f5" />
					</Animated.View>
				</Animated.View>
			</Animated.View>
		</Pressable>
	);
}
