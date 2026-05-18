import { useHaptics } from "@/hooks/useHaptics";
import React from "react";
import {
	Text,
	TextProps,
	TouchableOpacity,
	TouchableOpacityProps,
	View,
	ViewProps,
} from "react-native";

interface ButtonProps extends TouchableOpacityProps {
	children: React.ReactNode;
	className?: string;
}

function Button({ children, onPress, className = "", ...props }: ButtonProps) {
	const haptics = useHaptics();

	const handlePress = (e: any) => {
		haptics.light();
		onPress?.(e);
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			activeOpacity={0.7}
			className={`bg-zinc-100 px-4 py-3 rounded-3xl items-center flex-row gap-2 ${className}`}
			{...props}
		>
			{children}
		</TouchableOpacity>
	);
}

function ButtonText({ children, className = "", ...props }: TextProps) {
	return (
		<Text className={`text-black font-display text-2xl ${className}`} {...props}>
			{children}
		</Text>
	);
}

function ButtonIcon({ children, className = "", ...props }: ViewProps) {
	return (
		<View className={`items-center justify-center ${className}`} {...props}>
			{children}
		</View>
	);
}

// Compound component pattern
Button.Text = ButtonText;
Button.Icon = ButtonIcon;

export default Button;
