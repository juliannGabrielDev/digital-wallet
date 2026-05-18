import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SnakeDivider from "@/components/ui/SnakeDivider";
import { useAuth } from "@/context/AuthContext";
import { useHaptics } from "@/hooks/useHaptics";
import { api } from "@/services/api";
import { walletService } from "@/services/wallet";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ContactUser {
	id: string;
	username: string;
	email: string;
	first_name?: string;
	last_name?: string;
}

interface Contact {
	id: number | string;
	alias: string;
	created_at: string;
	contact_user: ContactUser;
}

const getAvatarStyle = (name: string, isSelected: boolean) => {
	if (isSelected) {
		return {
			bgClass: "bg-emerald-500/20 border-emerald-500",
			textClass: "text-emerald-400 font-bold",
		};
	}

	// Simple hash function to get a consistent color index
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}

	const colors = [
		{ bg: "bg-violet-500/10 border-violet-500/30", text: "text-violet-400" },
		{ bg: "bg-indigo-500/10 border-indigo-500/30", text: "text-indigo-400" },
		{ bg: "bg-cyan-500/10 border-cyan-500/30", text: "text-cyan-400" },
		{ bg: "bg-amber-500/10 border-amber-500/30", text: "text-amber-400" },
		{ bg: "bg-rose-500/10 border-rose-500/30", text: "text-rose-400" },
		{ bg: "bg-teal-500/10 border-teal-500/30", text: "text-teal-400" },
		{ bg: "bg-sky-500/10 border-sky-500/30", text: "text-sky-400" },
	];

	const index = Math.abs(hash) % colors.length;
	return {
		bgClass: `${colors[index].bg} active:border-zinc-500`,
		textClass: colors[index].text,
	};
};

export default function SendMoneyScreen() {
	const { bottom } = useSafeAreaInsets();
	const router = useRouter();
	const haptics = useHaptics();
	const { user } = useAuth();
	const [permission, requestPermission] = useCameraPermissions();

	// State
	const [userKey, setUserKey] = useState("");
	const [amount, setAmount] = useState("");
	const [showScanner, setShowScanner] = useState(false);
	const [scanned, setScanned] = useState(false);

	// API and Validation State
	const [isLoading, setIsLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState("");
	const [balance, setBalance] = useState<number | null>(null);
	const [balanceLoading, setBalanceLoading] = useState(true);

	// Contacts State
	const [contacts, setContacts] = useState<Contact[]>([]);
	const [contactsLoading, setContactsLoading] = useState(true);
	const [isAddingContact, setIsAddingContact] = useState(false);

	const handleAddContact = async () => {
		if (!userKey || userKey.length < 5) return;
		setIsAddingContact(true);
		haptics.medium();
		try {
			await api.post("/users/me/contacts/", {
				alias: "Nuevo Contacto",
				contact_user_id: userKey,
			});
			haptics.success();
			// Recargar contactos
			const res = await api.get<Contact[]>("/users/me/contacts/");
			setContacts(res.data || []);
			Alert.alert("¡Éxito!", "Usuario agregado a tus contactos.");
		} catch (error: any) {
			haptics.error();
			Alert.alert("Error", error?.response?.data?.contact_user_id || "No se pudo agregar el contacto. Verifica el ID.");
		} finally {
			setIsAddingContact(false);
		}
	};

	// Fetch current balance on open
	useEffect(() => {
		walletService
			.getBalance()
			.then((data) => {
				setBalance(parseFloat(data.balance) || 0);
			})
			.catch((err) => {
				console.error("Error fetching balance inside modal:", err);
			})
			.finally(() => {
				setBalanceLoading(false);
			});
	}, []);

	// Fetch contacts on open
	useEffect(() => {
		api.get<Contact[]>("/users/me/contacts/")
			.then((res) => {
				setContacts(res.data || []);
			})
			.catch((err) => {
				console.error("Error fetching contacts inside modal:", err);
			})
			.finally(() => {
				setContactsLoading(false);
			});
	}, []);

	// Camera permission handling
	if (!permission) {
		return <View className="flex-1 bg-zinc-900" />;
	}

	if (!permission.granted) {
		return (
			<View className="flex-1 bg-zinc-900 items-center justify-center p-6">
				<View className="bg-zinc-800 p-6 rounded-full mb-6">
					<Ionicons name="camera-outline" size={64} color="#10b981" />
				</View>
				<Text className="text-zinc-100 text-2xl font-display mt-4 text-center">
					Acceso a la Cámara Requerido
				</Text>
				<Text className="text-zinc-400 text-center font-sans mt-2 mb-8 px-6 leading-relaxed">
					Para escanear códigos QR de tus amigos de forma instantánea, por favor
					concede permisos para usar tu cámara.
				</Text>
				<Button
					onPress={() => {
						haptics.medium();
						requestPermission();
					}}
					className="w-full justify-center py-4 rounded-3xl"
				>
					<Button.Text className="text-zinc-950 ">Conceder Permiso</Button.Text>
				</Button>
				<TouchableOpacity
					onPress={() => {
						haptics.light();
						router.back();
					}}
					className="mt-6 py-2"
				>
					<Text className="text-zinc-500 font-sans text-base font-medium">
						Volver
					</Text>
				</TouchableOpacity>
			</View>
		);
	}

	// QR Code Scanner callback
	const handleBarCodeScanned = ({ data }: { data: string }) => {
		if (scanned) return;
		setScanned(true);
		haptics.heavy();

		try {
			const parsed = JSON.parse(data);
			if (parsed.type === "wallet_transfer" && parsed.userId) {
				if (user && parsed.userId === user.id) {
					haptics.error();
					Alert.alert(
						"Acción Inválida",
						"No puedes transferirte dinero a ti mismo.",
						[{ text: "Entendido", onPress: () => setScanned(false) }],
					);
					return;
				}
				setUserKey(parsed.userId);
				setShowScanner(false);
				setScanned(false);
				setErrorMsg("");
				haptics.success();
			} else {
				throw new Error("Invalid format");
			}
		} catch (error) {
			// Fallback: If not JSON, but still a string, treat the whole value as the raw ID
			const rawId = data.trim();
			if (
				rawId &&
				rawId.length > 5 &&
				!rawId.includes("{") &&
				!rawId.includes("[")
			) {
				if (user && rawId === user.id) {
					haptics.error();
					Alert.alert(
						"Acción Inválida",
						"No puedes transferirte dinero a ti mismo.",
						[{ text: "Entendido", onPress: () => setScanned(false) }],
					);
					return;
				}
				setUserKey(rawId);
				setShowScanner(false);
				setScanned(false);
				setErrorMsg("");
				haptics.success();
			} else {
				haptics.error();
				Alert.alert(
					"Código QR Inválido",
					"Este código no pertenece a una cuenta válida de MyWallet.",
					[{ text: "Reintentar", onPress: () => setScanned(false) }],
				);
			}
		}
	};

	// Transfer action execution
	const handleSend = async () => {
		haptics.medium();
		setErrorMsg("");

		const cleanUserKey = userKey.trim();

		// Validation
		if (!cleanUserKey) {
			setErrorMsg("Por favor ingresa la clave del destinatario.");
			haptics.error();
			return;
		}

		if (user && cleanUserKey === user.id) {
			setErrorMsg("No puedes transferirte dinero a ti mismo.");
			haptics.error();
			return;
		}

		if (!amount || parseFloat(amount) <= 0) {
			setErrorMsg("Por favor ingresa una cantidad válida mayor a $0.");
			haptics.error();
			return;
		}

		if (balance !== null && parseFloat(amount) > balance) {
			setErrorMsg(
				`Saldo insuficiente. Tu saldo actual es de $${balance.toLocaleString("en-US")}.`,
			);
			haptics.error();
			return;
		}

		setIsLoading(true);
		try {
			await walletService.sendMoney(cleanUserKey, amount);
			haptics.success();
			Alert.alert(
				"¡Transferencia Exitosa!",
				`Has enviado $${parseFloat(amount).toLocaleString("en-US")} con éxito.`,
				[{ text: "Excelente", onPress: () => router.back() }],
			);
		} catch (error: any) {
			haptics.error();
			const msg =
				error?.response?.data?.error ||
				"Error al realizar la transferencia. Verifica la clave e intenta de nuevo.";
			setErrorMsg(msg);
		} finally {
			setIsLoading(false);
		}
	};

	// Scanner Full Screen View
	if (showScanner) {
		return (
			<View className="flex-1 bg-black">
				<CameraView
					style={StyleSheet.absoluteFillObject}
					onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
					barcodeScannerSettings={{
						barcodeTypes: ["qr"],
					}}
				/>

				{/* Full screen layout overlay */}
				<View className="flex-1 justify-between bg-black/60 px-6 py-12">
					{/* Top Area */}
					<View className="items-center mt-8">
						<Text className="text-zinc-100 font-display text-2xl font-bold">
							Escanear QR
						</Text>
						<Text className="text-zinc-400 font-sans text-sm mt-2 text-center px-6">
							Encuentra el código QR en la sección "Recibir" del destinatario
						</Text>
					</View>

					{/* Center Scanner Frame */}
					<View className="items-center justify-center">
						<View className="w-64 h-64 border border-zinc-500/30 rounded-3xl relative items-center justify-center">
							{/* Corners */}
							<View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
							<View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
							<View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
							<View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />

							<Ionicons
								name="qr-code-outline"
								size={80}
								color="rgba(255, 255, 255, 0.15)"
							/>
						</View>
					</View>

					{/* Bottom Area Actions */}
					<View className="items-center mb-8">
						<TouchableOpacity
							onPress={() => {
								haptics.light();
								setShowScanner(false);
							}}
							className="bg-zinc-900/90 py-4 px-8 rounded-full border border-zinc-800 flex-row items-center gap-2 active:opacity-85"
						>
							<Ionicons name="close-circle-outline" size={20} color="#ef4444" />
							<Text className="text-red-400 font-sans font-bold text-base">
								Cancelar Escaneo
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	}

	// Main Form UI Screen
	return (
		<KeyboardAwareScrollView
			className="flex-1 bg-zinc-900 px-6"
			contentContainerClassName="pt-6"
			contentContainerStyle={{ paddingBottom: bottom + 40 }}
			enableOnAndroid
			extraScrollHeight={100}
			keyboardShouldPersistTaps="handled"
		>
			<View className="flex-1">
				<View className="w-12 h-1.5 bg-zinc-800 rounded-full mb-4 self-center" />
				{/* Close Modal Header */}
				<Button
					onPress={() => {
						haptics.light();
						router.back();
					}}
					className="self-end"
				>
					<Button.Icon>
						<Ionicons name="close" size={24} color="black" />
					</Button.Icon>
				</Button>
				{/* Title */}
				<Text className="text-zinc-100 text-5xl font-display mb-6">
					Enviar Dinero
				</Text>
				{/* Available Balance Card */}
				<View className="bg-zinc-800/40 border border-zinc-800 p-5 rounded-3xl mb-6">
					<Text className="text-zinc-400 text-xs font-sans font-bold uppercase tracking-wider mb-1">
						Tu Saldo Disponible
					</Text>
					{balanceLoading ? (
						<ActivityIndicator
							size="small"
							color="#10b981"
							className="self-start mt-1"
						/>
					) : (
						<Text className="text-3xl text-zinc-100 font-display">
							$
							{balance !== null
								? balance.toLocaleString("en-US", { minimumFractionDigits: 2 })
								: "0.00"}
						</Text>
					)}
				</View>

				{/* Contacts List Section */}
				<View className="mb-6">
					<Text className="text-zinc-400 text-xs font-sans font-bold uppercase tracking-wider mb-3">
						Seleccionar Contacto
					</Text>
					{contactsLoading ? (
						<View className="flex-row items-center gap-3 bg-zinc-800/20 border border-zinc-800/40 p-4 rounded-3xl">
							<ActivityIndicator size="small" color="#10b981" />
							<Text className="text-zinc-500 font-sans text-xs">
								Cargando contactos...
							</Text>
						</View>
					) : contacts.length === 0 ? (
						<View className="bg-zinc-800/20 border border-zinc-800/40 p-4 rounded-3xl">
							<Text className="text-zinc-500 font-sans text-xs italic">
								Aún no tienes contactos guardados.
							</Text>
						</View>
					) : (
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerClassName="flex-row gap-4"
							className="py-1"
						>
							{contacts.map((contact) => {
								const name =
									contact.alias ||
									contact.contact_user.first_name ||
									contact.contact_user.username;
								const initials = name
									.split(" ")
									.map((n) => n[0])
									.join("")
									.substring(0, 2)
									.toUpperCase();
								const isSelected = userKey === contact.contact_user.id;
								const avatarStyle = getAvatarStyle(name, isSelected);

								return (
									<TouchableOpacity
										key={contact.id}
										onPress={() => {
											haptics.light();
											setUserKey(contact.contact_user.id);
											if (errorMsg) setErrorMsg("");
										}}
										className="items-center"
										style={{ width: 70 }}
									>
										<View
											className={`w-14 h-14 rounded-full items-center justify-center border-2 transition-all ${avatarStyle.bgClass}`}
										>
											<Text className={`font-display text-lg ${avatarStyle.textClass}`}>
												{initials}
											</Text>
										</View>
										<Text
											className={`text-[11px] mt-2 text-center font-sans font-medium w-full ${
												isSelected ? "text-emerald-400 font-bold" : "text-zinc-400"
											}`}
											numberOfLines={1}
											ellipsizeMode="tail"
										>
											{name}
										</Text>
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					)}
				</View>

				{/* Input: Recipient User Key */}
				<View className="relative mb-4">
					<Input
						label="Clave del Destinatario (ID)"
						placeholder="Introduce el ID del destinatario"
						required
						icon="person-outline"
						value={userKey}
						onChangeText={(text) => {
							setUserKey(text);
							if (errorMsg) setErrorMsg("");
						}}
						autoCapitalize="none"
						autoCorrect={false}
					/>
				</View>
				
				{/* Add to contacts logic */}
				{userKey.trim().length > 5 && !contacts.some(c => c.contact_user.id === userKey.trim()) && (!user || user.id !== userKey.trim()) && (
					<TouchableOpacity
						onPress={handleAddContact}
						disabled={isAddingContact}
						className="flex-row items-center justify-center bg-zinc-800/80 border border-zinc-700/50 py-3.5 px-4 rounded-3xl mb-6 gap-2 active:opacity-85"
					>
						{isAddingContact ? (
							<ActivityIndicator size="small" color="#60a5fa" />
						) : (
							<Ionicons name="person-add-outline" size={20} color="#60a5fa" />
						)}
						<Text className="text-blue-400 font-sans font-bold text-base">
							{isAddingContact ? "Agregando..." : "Agregar a mis contactos"}
						</Text>
					</TouchableOpacity>
				)}
				{/* Quick scan shortcut button */}
				<TouchableOpacity
					onPress={() => {
						haptics.medium();
						setShowScanner(true);
					}}
					className="flex-row items-center justify-center bg-zinc-800 border border-zinc-800 py-3.5 px-4 rounded-3xl mb-6 gap-2 active:opacity-85"
				>
					<Ionicons name="qr-code-outline" size={20} color="#10b981" />
					<Text className="text-emerald-400 font-sans font-bold text-base">
						Escanear Código QR
					</Text>
				</TouchableOpacity>
				{/* Input: Transfer Amount */}
				<Input
					label="Cantidad a Enviar"
					placeholder="0.00"
					required
					icon="cash-outline"
					keyboardType="numeric"
					value={amount}
					onChangeText={(text) => {
						setAmount(text);
						if (errorMsg) setErrorMsg("");
					}}
				/>
				{/* Beautiful Divider */}
				<View className="my-4 w-full items-center">
					<SnakeDivider
						color="#3f3f46"
						height={16}
						strokeWidth={2}
						frequency={6}
						speed={3000}
					/>
				</View>
				{/* Inline Error alert if exists */}
				{errorMsg ? (
					<View className="mb-6 flex-row items-center bg-red-500/10 border border-red-500/20 p-4 rounded-3xl">
						<Ionicons name="alert-circle-outline" size={20} color="#ef4444" />
						<Text className="text-red-400 font-bold font-sans ml-2 flex-1 text-sm">
							{errorMsg}
						</Text>
					</View>
				) : null}
				{/* Submit Button */}
				<Button
					onPress={handleSend}
					className="justify-center py-4 bg-zinc-100 rounded-3xl self-end"
					disabled={isLoading}
					style={{ opacity: isLoading ? 0.7 : 1 }}
				>
					{isLoading ? (
						<ActivityIndicator size="small" color="#18181b" />
					) : (
						<>
							<Button.Icon>
								<Ionicons name="paper-plane" size={20} color="black" />
							</Button.Icon>
							<Button.Text className="text-zinc-950">Enviar Dinero</Button.Text>
						</>
					)}
				</Button>
			</View>
		</KeyboardAwareScrollView>
	);
}
