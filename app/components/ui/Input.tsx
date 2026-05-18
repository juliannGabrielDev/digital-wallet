import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
	type TextInputProps,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';

interface InputProps extends TextInputProps {
	placeholder: string;
	className?: string;
	label: string;
	required?: boolean;
	error?: string;
	icon?: React.ComponentProps<typeof Ionicons>['name'] | null;
}

export default function Input({
	placeholder,
	className = '',
	label,
	required = false,
	error,
	icon = 'text-outline',
	...props
}: InputProps) {
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const isPasswordField = props.secureTextEntry;

	return (
		<View className="mb-4">
			<Text className="font-sans font-bold text-zinc-100 mb-2">
				{label}
				{required && <Text className="text-red-400">*</Text>}
			</Text>
			<View
				className={`border-2 py-2 px-4 rounded-3xl bg-zinc-800 flex-row items-center ${
					error ? 'border-red-400' : 'border-zinc-500'
				} ${className}`}
			>
				{icon && (
					<View className="mr-2">
						<Ionicons
							name={icon}
							size={24}
							color="#D4D4D8"
						/>
					</View>
				)}
				<TextInput
					placeholder={placeholder}
					placeholderTextColor={'#D4D4D8'}
					className="text-zinc-100 font-sans text-lg flex-1 py-3"
					{...props}
					secureTextEntry={isPasswordField && !isPasswordVisible}
				/>
				{isPasswordField && (
					<TouchableOpacity
						onPress={() => setIsPasswordVisible(!isPasswordVisible)}
						activeOpacity={0.7}
						className="ml-2"
					>
						<Ionicons
							name={
								isPasswordVisible
									? 'eye-off-outline'
									: 'eye-outline'
							}
							size={20}
							color="#D4D4D8"
						/>
					</TouchableOpacity>
				)}
			</View>
			{error ? (
				<Text className="text-red-400 font-sans font-medium text-sm mt-1 ml-2">
					{error}
				</Text>
			) : null}
		</View>
	);
}
