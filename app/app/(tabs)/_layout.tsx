import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import { useMemo } from "react";
import { Platform } from "react-native";

export default function TabsLayout() {
	const tabsProps = useMemo(
		() =>
			Platform.OS === "android"
				? {
						backgroundColor: "#18181b", // bg-zinc-900
						indicatorColor: "#ffffff", // white pill
						badgeBackgroundColor: "#ef4444", // red-500
						badgeTextColor: "#ffffff",
						iconColor: {
							default: "#71717a", // text-zinc-500
							selected: "#18181b", // dark icon inside white pill
						},
						labelStyle: {
							default: {
								color: "#71717a",
							},
							selected: {
								color: "#ffffff",
							},
						},
				  }
				: {
						tintColor: "#ffffff",
						badgeBackgroundColor: "#ef4444",
						badgeTextColor: "#ffffff",
						labelStyle: { color: "#ffffff" },
				  },
		[]
	);

	return (
		<ThemeProvider value={DarkTheme}>
			<NativeTabs {...tabsProps as any}>
				<NativeTabs.Trigger name="dashboard">
					<NativeTabs.Trigger.Label>Dashboard</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="house.fill" md="home" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="transactions">
					<NativeTabs.Trigger.Label>Transacciones</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="list.bullet" md="list" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="contacts">
					<NativeTabs.Trigger.Label>Contactos</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="person.2.fill" md="people" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="notifications">
					<NativeTabs.Trigger.Label>Notificaciones</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="bell.fill" md="notifications" />
					<NativeTabs.Trigger.Badge>3</NativeTabs.Trigger.Badge>
				</NativeTabs.Trigger>
				
				<NativeTabs.Trigger name="profile">
					<NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="person.fill" md="person" />
				</NativeTabs.Trigger>
			</NativeTabs>
		</ThemeProvider>
	);
}

