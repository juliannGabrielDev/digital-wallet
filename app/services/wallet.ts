import { api, SERVICE_URLS } from "./api";

export const walletService = {
    sendMoney: async (receiverUserId: string, amount: string) => {
        const response = await api.post(
            '/wallet/transfer/', 
            {
                receiver_user_id: receiverUserId,
                amount: amount
            },
            { baseUrl: SERVICE_URLS.WALLET }
        );

        return response.data;
    },
    getBalance: async () => {
        const response = await api.get('/wallet/', { baseUrl: SERVICE_URLS.WALLET });
        return response.data;
    },
    deactivateCard: async () => {
        const response = await api.post('/wallet/deactivate/', {}, { baseUrl: SERVICE_URLS.WALLET });
        return response.data;
    },
    activateCard: async () => {
        const response = await api.post('/wallet/activate/', {}, { baseUrl: SERVICE_URLS.WALLET });
        return response.data;
    },
    getTransactions: async () => {
        const response = await api.get('/wallet/transactions/', { baseUrl: SERVICE_URLS.WALLET });
        return response.data;
    }
};
