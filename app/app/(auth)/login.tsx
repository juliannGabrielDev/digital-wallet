import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SnakeDivider from "@/components/ui/SnakeDivider";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { login } = useAuth();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [usernameError, setUsernameError] = useState("");
	const [loginError, setLoginError] = useState("");

	// Configuración de animación para el loader
	const spinValue = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (isLoading) {
			spinValue.setValue(0);
			Animated.loop(
				Animated.timing(spinValue, {
					toValue: 1,
					duration: 1500,
					easing: Easing.linear,
					useNativeDriver: true,
				}),
			).start();
		} else {
			spinValue.stopAnimation();
		}
	}, [isLoading, spinValue]);

	const spin = spinValue.interpolate({
		inputRange: [0, 1],
		outputRange: ["0deg", "360deg"],
	});

	const validateUsername = () => {
		const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
		if (username && !usernameRegex.test(username)) {
			setUsernameError(
				"Usuario inválido (sin espacios ni caracteres especiales)",
			);
			return false;
		}
		setUsernameError("");
		return true;
	};

	const handleLogin = async () => {
		setLoginError("");

		if (!username || !password) {
			setLoginError("Llena todos los campos");
			return;
		}

		if (!validateUsername()) {
			return;
		}

		setIsLoading(true);
		const result = await login(username, password);
		setIsLoading(false);

		if (result.success) {
			router.replace("/dashboard");
		} else {
			setLoginError(result.message || "Credenciales inválidas");
		}
	};

	return (
		<KeyboardAwareScrollView
			enableOnAndroid
			enableAutomaticScroll
			extraScrollHeight={100}
			keyboardShouldPersistTaps="handled"
			className="bg-zinc-900"
			contentContainerStyle={{
				paddingTop: insets.top,
				paddingBottom: insets.bottom + 40,
				flexGrow: 1,
			}}
			contentContainerClassName="px-4 pt-2"
		>
			<Image
				source={require("@/assets/images/eyes_3d.png")}
				style={{ width: 60, height: 60, marginBottom: 16 }}
			/>
			<Text className="text-5xl font-display text-zinc-100 mb-6">
				Inicia Sesión
			</Text>
			<View className="flex-1 justify-center">
				<Input
					placeholder="Ingresa tu nombre de usuario"
					label="Usuario"
					required
					autoComplete="username"
					autoCorrect={false}
					autoCapitalize="none"
					icon="person-outline"
					value={username}
					onChangeText={(text) => {
						setUsername(text);
						if (usernameError) setUsernameError("");
						if (loginError) setLoginError("");
					}}
					onBlur={validateUsername}
					error={usernameError}
				/>
				<Input
					placeholder="••••••••"
					label="Contraseña"
					required
					secureTextEntry={true}
					autoComplete="password"
					autoCorrect={false}
					autoCapitalize="none"
					icon="lock-closed-outline"
					value={password}
					onChangeText={(text) => {
						setPassword(text);
						if (loginError) setLoginError("");
					}}
				/>
				{loginError ? (
					<View className="mb-4 flex-row items-center">
						<Ionicons name="alert-circle-outline" size={20} color="#e53e3e" />
						<Text className="text-red-400 font-bold font-sans ml-2 flex-1">
							{loginError}
						</Text>
					</View>
				) : null}
				<Button
					onPress={handleLogin}
					className="self-end"
					disabled={isLoading}
					style={{ opacity: isLoading ? 0.7 : 1 }}
				>
					<Button.Icon>
						{isLoading ? (
							<Animated.View style={{ transform: [{ rotate: spin }] }}>
								<Image
									source={require("@/assets/images/burst.svg")}
									style={{ width: 24, height: 24 }}
									tintColor="#18181b"
								/>
							</Animated.View>
						) : (
							<Ionicons name="log-in-outline" size={24} color="black" />
						)}
					</Button.Icon>
					<Button.Text>{isLoading ? "Accediendo" : "Acceder"}</Button.Text>
				</Button>
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

			<Text className="text-zinc-100 text-md text-right font-sans mb-4">
				¿No tienes una cuenta?
			</Text>
			<Link href="/register" asChild>
				<Button className="self-end">
					<Button.Icon>
						<Ionicons name="add-outline" size={24} color="black" />
					</Button.Icon>
					<Button.Text>Registrarse</Button.Text>
				</Button>
			</Link>
		</KeyboardAwareScrollView>
	);
}
