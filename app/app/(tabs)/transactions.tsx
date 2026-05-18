import { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { walletService } from "@/services/wallet";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

// Interfaces
interface Transaction {
    id: number;
    from_wallet_id: string;
    to_wallet_id: string;
    amount: string;
    currency: string;
    status: string;
    description: string;
    created_at: string;
}

export default function TransactionsScreen() {
    const insets = useSafeAreaInsets();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [myWalletId, setMyWalletId] = useState<string>("");

    const fetchData = async () => {
        try {
            const walletData = await walletService.getBalance();
            setMyWalletId(walletData.id);
            const txData = await walletService.getTransactions();
            setTransactions(txData);
        } catch (error) {
            console.error("Error fetching transactions:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const renderItem = ({ item }: { item: Transaction }) => {
        const isSent = item.from_wallet_id === myWalletId;
        const amountPrefix = isSent ? "-" : "+";
        const iconName = isSent ? "arrow-up" : "arrow-down";
        const iconColor = isSent ? "#ef4444" : "#10b981"; // red for sent, green for received
        
        const date = new Date(item.created_at);
        const formattedDate = date.toLocaleDateString("es-MX", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
        const formattedTime = date.toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
        });

        return (
            <View className="flex-row items-center justify-between bg-zinc-800/40 p-4 rounded-3xl mb-3 border border-zinc-800">
                <View className="flex-row items-center flex-1">
                    <View 
                        className="w-12 h-12 rounded-full items-center justify-center mr-4" 
                        style={{ backgroundColor: `${iconColor}20` }}
                    >
                        <Ionicons name={iconName} size={20} color={iconColor} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-zinc-100 font-sans font-bold text-base" numberOfLines={1}>
                            {isSent ? "Envío de dinero" : "Dinero recibido"}
                        </Text>
                        <Text className="text-zinc-500 font-sans text-xs mt-0.5">
                            {formattedDate} • {formattedTime}
                        </Text>
                        {item.description && item.description !== "Transferencia desde App Móvil" && (
                            <Text className="text-zinc-400 font-sans text-xs mt-1 italic" numberOfLines={1}>
                                "{item.description}"
                            </Text>
                        )}
                    </View>
                </View>
                <View className="items-end ml-2">
                    <Text 
                        className="font-display text-lg"
                        style={{ color: iconColor }}
                    >
                        {amountPrefix}${parseFloat(item.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </Text>
                    <Text className="text-zinc-500 font-sans text-xs uppercase tracking-wider mt-0.5">
                        {item.currency}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <View 
            className="flex-1 bg-zinc-900 px-4"
            style={{ paddingTop: insets.top }}
        >
            <View className="mt-4 mb-6">
                <Text className="text-4xl text-zinc-100 font-display">
                    Transacciones
                </Text>
                <Text className="text-zinc-400 font-sans text-sm mt-1">
                    Tu historial de movimientos recientes
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10b981" />
                </View>
            ) : transactions.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="receipt-outline" size={64} color="#3f3f46" />
                    <Text className="text-zinc-400 font-sans text-center mt-4 text-base">
                        Aún no tienes transacciones. Tus movimientos aparecerán aquí.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
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
