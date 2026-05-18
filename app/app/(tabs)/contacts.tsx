import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useHaptics } from "@/hooks/useHaptics";

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

const getAvatarStyle = (name: string) => {
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
        bgClass: `${colors[index].bg}`,
        textClass: colors[index].text,
    };
};

export default function ContactsScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const haptics = useHaptics();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchContacts = async () => {
        try {
            const res = await api.get<Contact[]>("/users/me/contacts/");
            setContacts(res.data || []);
        } catch (error) {
            console.error("Error fetching contacts:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchContacts();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchContacts();
    };

    const renderItem = ({ item }: { item: Contact }) => {
        const name = item.alias || item.contact_user.first_name || item.contact_user.username;
        const initials = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
        
        const avatarStyle = getAvatarStyle(name);

        return (
            <TouchableOpacity 
                activeOpacity={0.7}
                onPress={() => {
                    haptics.light();
                    // Opcionalmente, podemos navegar a enviar dinero con este usuario:
                    // router.push(`/(modals)/send-money?prefillUserId=${item.contact_user.id}`);
                }}
                className="flex-row items-center justify-between bg-zinc-800/40 p-4 rounded-3xl mb-3 border border-zinc-800"
            >
                <View className="flex-row items-center flex-1">
                    <View 
                        className={`w-14 h-14 rounded-full items-center justify-center mr-4 border-2 ${avatarStyle.bgClass}`}
                    >
                        <Text className={`font-display text-lg ${avatarStyle.textClass}`}>
                            {initials}
                        </Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-zinc-100 font-sans font-bold text-base" numberOfLines={1}>
                            {name}
                        </Text>
                        <Text className="text-zinc-500 font-sans text-xs mt-0.5" numberOfLines={1}>
                            @{item.contact_user.username}
                        </Text>
                        <Text className="text-zinc-400 font-sans text-xs mt-1" numberOfLines={1}>
                            ID: {item.contact_user.id}
                        </Text>
                    </View>
                </View>
                <View className="ml-2 bg-zinc-800 p-3 rounded-full">
                    <Ionicons name="paper-plane-outline" size={20} color="#10b981" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View 
            className="flex-1 bg-zinc-900 px-4"
            style={{ paddingTop: insets.top }}
        >
            <View className="mt-4 mb-6">
                <Text className="text-4xl text-zinc-100 font-display">
                    Contactos
                </Text>
                <Text className="text-zinc-400 font-sans text-sm mt-1">
                    Tus amigos y conexiones
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : contacts.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="people-outline" size={64} color="#3f3f46" />
                    <Text className="text-zinc-400 font-sans text-center mt-4 text-base">
                        Aún no tienes contactos guardados.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="pb-24"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#10b981"
                        />
                    }
                />
            )}
        </View>
    );
}
