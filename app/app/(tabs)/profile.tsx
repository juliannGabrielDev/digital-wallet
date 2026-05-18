import Button from "@/components/ui/Button";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
	const { logout } = useAuth();

	return (
		<View className="flex-1 items-center justify-center bg-zinc-900">
			<Text className="text-xl font-bold text-zinc-100 mb-4">
				Profile Screen
			</Text>
			<Button onPress={logout}>
				<Button.Icon>
					<Ionicons name="log-out-outline" size={24} color="black" />
				</Button.Icon>
				<Button.Text>Cerrar Sesión</Button.Text>
			</Button>
		</View>
	);
}
