import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ReceiveMoneyScreen() {
	const { user } = useAuth();
	const router = useRouter();
	const insets = useSafeAreaInsets();

	if (!user) return null;

	const qrPayload = JSON.stringify({
		type: "wallet_transfer",
		userId: user.id,
		username: user.username,
	});

	return (
		<ScrollView
			className="flex-1 bg-zinc-900 px-6"
			contentContainerClassName="pt-6"
			contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
		>
			<View className="w-12 h-1.5 bg-zinc-800 rounded-full mb-4 self-center" />
			{/* Header */}
			<Button onPress={() => router.back()} className="self-end">
				<Button.Icon>
					<Ionicons name="close" size={24} color="black" />
				</Button.Icon>
			</Button>
			<Text className="text-zinc-100 text-6xl font-display">Recibir</Text>
			<View className="size-12" />

			{/* QR Card */}
			<View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
				<QRCode value={qrPayload} size={200} color="black" />
				<View className="mt-6 items-center">
					<Text className="text-zinc-900 font-sans font-bold text-lg">
						{user?.first_name} {user?.last_name}
					</Text>
					<Text className="text-zinc-500 font-sans text-sm mt-1">
						ID: {user?.id || "usuario"}
					</Text>
				</View>
			</View>

			<View className="mt-8 items-center">
				<Text className="text-zinc-400 text-center font-sans px-10">
					Muestra este código QR a la persona que te enviará dinero.
				</Text>
			</View>

			{/* Account Details */}
			<View className="w-full mt-10 gap-4">
				<DetailRow label="Banco" value="MyWallet Digital" icon="business" />
			</View>
		</ScrollView>
	);
}

function DetailRow({
	label,
	value,
	icon,
	copyable,
}: {
	label: string;
	value: string;
	icon: any;
	copyable?: boolean;
}) {
	return (
		<View className="flex-row items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800">
			<View className="bg-zinc-800 p-2 rounded-xl mr-4">
				<Ionicons name={icon} size={20} color="#a1a1aa" />
			</View>
			<View className="flex-1">
				<Text className="text-zinc-500 text-xs font-sans mb-0.5">{label}</Text>
				<Text className="text-zinc-200 text-base font-sans font-medium">
					{value}
				</Text>
			</View>
			{copyable && (
				<TouchableOpacity className="p-2">
					<Ionicons name="copy-outline" size={20} color="#3b82f6" />
				</TouchableOpacity>
			)}
		</View>
	);
}
