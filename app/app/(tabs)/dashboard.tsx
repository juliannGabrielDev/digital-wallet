import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import SnakeDivider from "../../components/ui/SnakeDivider";
import { useHaptics } from "../../hooks/useHaptics";

import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { walletService } from "@/services/wallet";

export default function DashboardScreen() {
	const [money, setMoney] = useState(0);
	const [isCardActive, setIsCardActive] = useState(true);
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { user } = useAuth();

	useFocusEffect(
		useCallback(() => {
			if (user) {
				walletService.getBalance()
					.then((data) => {
						setMoney(parseFloat(data.balance) || 0);
						setIsCardActive(data.is_active);
					})
					.catch((err) => console.error("Error fetching balance:", err));
			}
		}, [user])
	);

	return (
		<ScrollView
			className="flex-1 bg-zinc-900"
			contentContainerClassName="px-4 pb-20"
			style={{ paddingTop: insets.top }}
		>
			<Image
				source={require("@/assets/images/eyes_3d.png")}
				style={{ width: 60, height: 60 }}
			/>
			{/* Header */}
			<View className="items-center mt-3 mb-8">
				<Text className="text-3xl text-zinc-200 font-display">
					Hola {user?.first_name || "usuario"}
				</Text>
				<View className="my-6 w-full items-center">
					<SnakeDivider
						color="#3f3f46"
						height={16}
						strokeWidth={2}
						frequency={6}
						speed={3000}
					/>
				</View>
				<Text className="text-sm text-zinc-200 font-sans font-medium mb-2">
					Saldo Disponible
				</Text>
				<Text className="text-6xl text-zinc-100 font-display">
					${money.toLocaleString("en-US")}
				</Text>
			</View>

			{/* Buttons Group */}
			<View className="flex-row gap-3 w-full">
				<ActionButton
					icon="arrow-up-outline"
					label="Enviar"
					onPress={() => router.push("/(modals)/send-money")}
				/>
				<ActionButton
					icon="arrow-down-outline"
					label="Recibir"
					onPress={() => router.push("/(modals)/receive-money")}
				/>
				<ActionButton icon="add-outline" label="Comprar" />
			</View>

			{/* Card */}
			<View className="bg-black w-full aspect-[1.58/1] mt-6 rounded-[32px] p-4 justify-between overflow-hidden relative shadow-2xl">
				{!isCardActive && (
					<View className="absolute inset-0 bg-black/60 z-10 items-center justify-center">
						<Ionicons name="lock-closed" size={48} color="#a1a1aa" />
						<Text className="text-zinc-400 font-display text-xl mt-2">Tarjeta Pausada</Text>
					</View>
				)}
				<TouchableOpacity
					onPress={() => router.push("/(modals)/disable-card")}
					className="bg-zinc-100 self-end flex-row gap-1 px-2 py-2 rounded-full z-20"
				>
					<View className="size-2 rounded-full bg-zinc-900"></View>
					<View className="size-2 rounded-full bg-zinc-700"></View>
					<View className="size-2 rounded-full bg-zinc-500"></View>
				</TouchableOpacity>
				{/* Holographic Text Background */}
				<View className="items-center justify-center flex-1">
					<MaskedView
						style={{ flex: 1, width: "100%", height: "100%" }}
						maskElement={
							<View
								className="flex-1 bg-transparent items-center justify-center px-6"
								style={{ width: "100%", height: "100%" }}
							>
								<Text
									className="font-display text-black text-[75px] tracking-tighter"
									adjustsFontSizeToFit
									numberOfLines={1}
									style={{
										textAlign: "center",
										includeFontPadding: false,
										lineHeight: 85,
										transform: [{ translateY: 12 }],
									}}
								>
									MYWALLET
								</Text>
							</View>
						}
					>
						<LinearGradient
							colors={["#ffd1d4", "#b3e0ff", "#e0c2ff", "#ffffff"]}
							start={{ x: 0, y: 0.2 }}
							end={{ x: 1, y: 0.8 }}
							style={{ flex: 1, width: "100%", height: "100%", opacity: 0.9 }}
						/>
					</MaskedView>
				</View>

				{/* Foreground Elements */}
				<View className="flex-1 flex-row justify-between items-end pointer-events-none">
					{/* Chip */}
					<View className="mt-8 ml-2">
						<View className="w-14 h-10 border border-zinc-400/80 rounded-xl bg-zinc-200/10 justify-center items-center overflow-hidden backdrop-blur-md">
							{/* Chip lines pattern */}
							<View className="absolute top-2 w-full h-px bg-zinc-400/80" />
							<View className="absolute bottom-2 w-full h-px bg-zinc-400/80" />
							<View className="absolute w-[45%] h-full border-l border-r border-zinc-400/80 rounded-full" />
						</View>
					</View>

					{/* VISA Logo */}
					<View>
						<MaskedView
							style={{ width: 100, height: 30 }}
							maskElement={
								<View className="flex-1 w-full bg-transparent items-end justify-end">
									<Text
										className="font-sans font-bold text-3xl italic tracking-widest"
										style={{ lineHeight: 30 }}
									>
										VISA
									</Text>
								</View>
							}
						>
							<LinearGradient
								colors={["#b3e0ff", "#ffffff"]}
								start={{ x: 0, y: 0 }}
								end={{ x: 1, y: 0 }}
								style={{ flex: 1, width: "100%", height: "100%" }}
							/>
						</MaskedView>
					</View>
				</View>
			</View>

			{/* Snake Divider */}
			<View className="my-6 w-full items-center">
				<SnakeDivider
					color="#3f3f46"
					height={16}
					strokeWidth={2}
					frequency={6}
					speed={3000}
				/>
			</View>

			{/* Last Transactions List */}
			<Text className="text-zinc-100 text-3xl text-left font-display w-full">
				Transacciones
			</Text>
		</ScrollView>
	);
}

function ActionButton({
	icon,
	label,
	onPress,
}: {
	icon: any;
	label: string;
	onPress?: () => void;
}) {
	const haptics = useHaptics();
	const handlePress = () => {
		haptics.medium();
		onPress?.();
	};

	return (
		<TouchableOpacity
			onPress={handlePress}
			className="flex-1 bg-zinc-800 aspect-square rounded-3xl items-center justify-center border border-zinc-700/50"
		>
			<Ionicons name={icon} size={28} color="white" />
			<Text className="text-zinc-100 text-sm mt-3 font-sans font-medium">
				{label}
			</Text>
		</TouchableOpacity>
	);
}
