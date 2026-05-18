import "@/global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
	const { user, isLoading: authLoading } = useAuth();
	const [fontsLoaded, fontError] = useFonts({
		"Anton-Regular": require("../assets/fonts/Anton/Anton-Regular.ttf"),
		Anton: require("../assets/fonts/Anton/Anton-Regular.ttf"),
		"Geist-Regular": require("../assets/fonts/Geist/Geist-VariableFont_wght.ttf"),
		Geist: require("../assets/fonts/Geist/Geist-VariableFont_wght.ttf"),
	});

	useEffect(() => {
		if (fontError) console.error("Error loading fonts:", fontError);
		
		// Ocultamos el splash screen solo cuando las fuentes Y el estado de auth estén listos
		if (fontsLoaded && !authLoading) {
			SplashScreen.hideAsync();
		}
	}, [fontsLoaded, authLoading, fontError]);

	if (!fontsLoaded || authLoading) {
		return null;
	}

	const isLoggedIn = !!user;

	return (
		<Stack screenOptions={{ headerShown: false }}>
			{/* Rutas Protegidas (Solo accesibles si está logueado) */}
			<Stack.Protected guard={isLoggedIn}>
				<Stack.Screen name="index" />
				<Stack.Screen name="(tabs)" />
				<Stack.Screen
					name="(modals)/disable-card"
					options={{
						presentation: "formSheet",
						sheetAllowedDetents: [0.4],
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="(modals)/send-money"
					options={{
						presentation: "formSheet",
						sheetAllowedDetents: [0.8, 1],
						sheetInitialDetentIndex: 0,
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="(modals)/receive-money"
					options={{
						presentation: "formSheet",
						sheetAllowedDetents: [0.8, 1],
						sheetInitialDetentIndex: 0,
						headerShown: false,
					}}
				/>
			</Stack.Protected>

			{/* Rutas de Autenticación (Solo accesibles si NO está logueado) */}
			<Stack.Protected guard={!isLoggedIn}>
				<Stack.Screen name="(auth)" />
			</Stack.Protected>
		</Stack>
	);
}

export default function RootLayout() {
	return (
		<AuthProvider>
			<InitialLayout />
			<StatusBar style="light" />
		</AuthProvider>
	);
}
