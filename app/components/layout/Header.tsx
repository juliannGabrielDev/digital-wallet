import { Text, View } from "react-native";

export default function Header({ title }: { title: string }) {
	return (
		<View className="h-16 justify-center px-6 border-b-2 border-black bg-white">
			<Text className="text-xl font-black">{title}</Text>
		</View>
	);
}
