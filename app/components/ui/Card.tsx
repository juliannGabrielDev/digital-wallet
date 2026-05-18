import { View } from "react-native";

export default function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
	return (
		<View className={`bg-white border-2 border-black p-4 rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${className}`}>
			{children}
		</View>
	);
}
