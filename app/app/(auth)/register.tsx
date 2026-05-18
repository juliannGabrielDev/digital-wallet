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

export default function RegisterScreen() {
	const router = useRouter();
	const insets = useSafeAreaInsets();
	const { login, register } = useAuth();

	const [username, setUsername] = useState("");
	const [usernameError, setUsernameError] = useState("");

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");

	const [email, setEmail] = useState("");
	const [emailError, setEmailError] = useState("");

	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	const [isLoading, setIsLoading] = useState(false);
	const [registerError, setRegisterError] = useState("");

	// Loader animation
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
				"Usuario inválido (sin espacios ni caracteres especiales).",
			);
			return false;
		}
		setUsernameError("");
		return true;
	};

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const validateEmail = () => {
		if (email && !emailRegex.test(email)) {
			setEmailError("Email inválido.");
			return false;
		}
		setEmailError("");
		return true;
	};

	const handleRegister = async () => {
		setRegisterError("");

		if (
			!username ||
			!email ||
			!firstName ||
			!lastName ||
			!password ||
			!confirmPassword
		) {
			setRegisterError("Llena todos los campos por favor.");
			return;
		}

		if (password !== confirmPassword) {
			setRegisterError("Las contraseñas no coinciden.");
			return;
		}

		if (!validateUsername() || !validateEmail()) {
			return;
		}

		setIsLoading(true);
		const result = await register({
			username,
			email,
			first_name: firstName,
			last_name: lastName,
			password,
		});

		if (result.success) {
			const loginResult = await login(username, password);

			if (loginResult.success) {
				router.replace("/dashboard");
			} else {
				setRegisterError(
					loginResult.message ||
						"Registro exitoso, pero hubo un error al entrar.",
				);
				setIsLoading(false);
			}
		} else {
			setRegisterError(result.message || "Error al registrar.");
			setIsLoading(false);
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
			<Text className="text-5xl font-display text-zinc-100 mb-6">¡Únete!</Text>

			<View>
				<Input
					placeholder="Nombre de usuario"
					label="Usuario"
					required
					autoComplete="username"
					autoCorrect={false}
					autoCapitalize="none"
					value={username}
					onChangeText={(text) => {
						setUsername(text);
						if (usernameError) setUsernameError("");
						if (registerError) setRegisterError("");
					}}
					onBlur={validateUsername}
					error={usernameError}
				/>

				<View className="flex-row gap-4">
					<View className="flex-1">
						<Input
							placeholder="Nombre"
							label="Nombre"
							required
							value={firstName}
							onChangeText={(text) => {
								setFirstName(text);
								if (registerError) setRegisterError("");
							}}
						/>
					</View>
					<View className="flex-1">
						<Input
							placeholder="Apellido"
							label="Apellido"
							required
							value={lastName}
							onChangeText={(text) => {
								setLastName(text);
								if (registerError) setRegisterError("");
							}}
						/>
					</View>
				</View>

				<Input
					placeholder="correo@ejemplo.com"
					label="Email"
					required
					keyboardType="email-address"
					autoComplete="email"
					autoCorrect={false}
					autoCapitalize="none"
					icon="mail-outline"
					value={email}
					onChangeText={(text) => {
						setEmail(text);
						if (emailError) setEmailError("");
						if (registerError) setRegisterError("");
					}}
					onBlur={validateEmail}
					error={emailError}
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
						if (registerError) setRegisterError("");
					}}
				/>

				<Input
					placeholder="••••••••"
					label="Confirmar Contraseña"
					required
					secureTextEntry={true}
					autoComplete="password"
					autoCorrect={false}
					autoCapitalize="none"
					icon="checkmark-done-circle-outline"
					value={confirmPassword}
					onChangeText={(text) => {
						setConfirmPassword(text);
						if (registerError) setRegisterError("");
					}}
				/>

				{registerError ? (
					<View className="mb-4 flex-row items-center">
						<Ionicons name="alert-circle-outline" size={20} color="#e53e3e" />
						<Text className="text-red-400 font-bold font-sans ml-2 flex-1">
							{registerError}
						</Text>
					</View>
				) : null}

				<Button
					onPress={handleRegister}
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
							<Ionicons name="person-add-outline" size={24} color="black" />
						)}
					</Button.Icon>
					<Button.Text>
						{isLoading ? "Registrando" : "Crear Cuenta"}
					</Button.Text>
				</Button>
			</View>

			<View className="my-6 w-full items-center">
				<SnakeDivider
					color="#3f3f46"
					height={16}
					strokeWidth={2}
					frequency={6}
					speed={3000}
				/>
			</View>

			<Text className="text-zinc-100 text-md w-full text-right font-sans mb-4">
				¿Ya tienes una cuenta?
			</Text>
			<Link href="/login" asChild>
				<Button className="self-end">
					<Button.Icon>
						<Ionicons name="log-in-outline" size={24} color="black" />
					</Button.Icon>
					<Button.Text>Iniciar Sesión</Button.Text>
				</Button>
			</Link>
		</KeyboardAwareScrollView>
	);
}
