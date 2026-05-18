import * as SecureStore from "expo-secure-store";
import { jwtDecode } from "jwt-decode";
import {
	createContext,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { api } from "@/services/api";

// Define la estructura del usuario que viene de la API
export interface User {
	id: string | number;
	username: string;
	email: string;
	first_name?: string;
	last_name?: string;
	[key: string]: any;
}

// Define lo que exportará el contexto
interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	login: (
		username: string,
		password: string,
	) => Promise<{ success: boolean; message?: string }>;
	register: (
		data: {
			username: string;
			email: string;
			first_name: string;
			last_name: string;
			password: string;
		}
	) => Promise<{ success: boolean; message?: string }>;
	logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

// CUSTOM HOOK: La mejor forma de consumir el contexto
export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth debe ser usado dentro de un AuthProvider");
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	// Al abrir la app, revisa si ya hay un token guardado
	useEffect(() => {
		const loadToken = async () => {
			try {
				const token = await SecureStore.getItemAsync("access_token");
				const userData = await SecureStore.getItemAsync("user_data");
				
				if (token && userData) {
					setUser(JSON.parse(userData));
				} else if (token) {
					// Fallback decodificando el token si no hay info guardada
					const decoded = jwtDecode<User>(token);
					setUser(decoded);
				}
			} catch (error) {
				console.log("Error leyendo token:", error);
			}
			setIsLoading(false);
		};
		loadToken();
	}, []);

	const login = async (
		username: string,
		password: string,
	): Promise<{ success: boolean; message?: string }> => {
		try {
			const response = await api.post("/auth/login/", { username, password });

			const { access, refresh, user: userData } = response.data;

			// Guardar tokens de forma segura
			await SecureStore.setItemAsync("access_token", access);
			await SecureStore.setItemAsync("refresh_token", refresh);
			// También podemos guardar la info del usuario en SecureStore si queremos persistirla
			await SecureStore.setItemAsync("user_data", JSON.stringify(userData));

			setUser(userData);
			return { success: true };
		} catch (error: any) {
			if (error.response) {
				console.log("Error de login (Respuesta):", error.response.data);
				return { 
					success: false, 
					message: error.response.data?.detail || "Credenciales inválidas" 
				};
			}
			console.log("Error de login (Red/Fetch):", error);
			return { 
				success: false, 
				message: "No se pudo conectar con el servidor. Verifica tu conexión." 
			};
		}
	};

	const register = async (data: {
		username: string;
		email: string;
		first_name: string;
		last_name: string;
		password: string;
	}): Promise<{ success: boolean; message?: string }> => {
		try {
			const response = await api.post("/users/register/", data);

			// Dependiendo de si el registro hace auto-login o no
			// Si el backend devuelve tokens al registrar:
			if (response.data.access) {
				const { access, refresh, user: userData } = response.data;
				await SecureStore.setItemAsync("access_token", access);
				await SecureStore.setItemAsync("refresh_token", refresh);
				await SecureStore.setItemAsync("user_data", JSON.stringify(userData));
				setUser(userData);
			}

			return { success: true };
		} catch (error: any) {
			if (error.response) {
				console.log("Error de registro (Respuesta):", error.response.data);
				// El backend puede devolver errores por campo (ej: username already exists)
				const errors = error.response.data;
				let errorMessage = "Error al registrarse";
				
				if (typeof errors === 'object') {
					errorMessage = Object.values(errors).flat().join(". ");
				}

				return { 
					success: false, 
					message: errorMessage
				};
			}
			console.log("Error de registro (Red/Fetch):", error);
			return { 
				success: false, 
				message: "No se pudo conectar con el servidor." 
			};
		}
	};

	const logout = async () => {
		await SecureStore.deleteItemAsync("access_token");
		await SecureStore.deleteItemAsync("refresh_token");
		await SecureStore.deleteItemAsync("user_data");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
			{children}
		</AuthContext.Provider>
	);
};
