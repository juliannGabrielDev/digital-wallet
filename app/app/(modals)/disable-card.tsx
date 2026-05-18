import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import CustomSwitch from "../../components/ui/Switch";
import { walletService } from "@/services/wallet";

export default function DisableCardScreen() {
	const [isCardActive, setIsCardActive] = useState(true);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		walletService.getBalance()
			.then((data) => {
				setIsCardActive(data.is_active);
				setLoading(false);
			})
			.catch((err) => {
				console.error(err);
				setLoading(false);
			});
	}, []);

	const handleToggle = async (newValue: boolean) => {
		// Optimistic update
		setIsCardActive(newValue);
		try {
			if (newValue) {
				await walletService.activateCard();
			} else {
				await walletService.deactivateCard();
			}
		} catch (error) {
			Alert.alert("Error", "No se pudo actualizar el estado de la tarjeta");
			setIsCardActive(!newValue); // Revert
		}
	};

	return (
		<View className="flex-1 bg-zinc-900 p-6 items-center">
			<View className="w-12 h-1.5 bg-zinc-800 rounded-full mb-8" />

			<Text className="text-2xl font-display text-zinc-100 text-center">
				{loading ? "Cargando..." : isCardActive ? "Tarjeta Activa" : "Tarjeta Desactivada"}
			</Text>
			<Text className="text-zinc-400 min-h-16 text-center mt-4 font-sans">
				{isCardActive
					? "Apaga el interruptor para pausar temporalmente todos los pagos con esta tarjeta. Podrás reactivarla en cualquier momento."
					: "Tu tarjeta está pausada. No se procesarán pagos hasta que la reactives."}
			</Text>
			<View className="mt-6">
				{!loading && <CustomSwitch isActive={isCardActive} onToggle={handleToggle} />}
			</View>
		</View>
	);
}
