import { getMachineId } from '../utils/hardware';

const AUTH_TOKEN_KEY = 'lan_center_auth_token';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
    email: string;
    lanCenterName: string;
    currencySymbol: string;
    role?: 'admin' | 'user';
}

export const CloudAuth = {
    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    },

    login: async (email: string, password: string): Promise<User> => {
        const machineId = await getMachineId();
        console.log(`Logging in with ${email} on device ${machineId}`);

        try {
            const response = await fetch(`${API_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error de autenticación');
            }

            const user: User = {
                email: data.user.email,
                lanCenterName: data.user.tenantName || 'Mi Lan Center',
                currencySymbol: 'S/',
                role: data.user.role
            };

            localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            localStorage.setItem('lan_center_user', JSON.stringify(user));

            return user;
        } catch (error: any) {
            console.error(error);
            throw new Error(error.message || 'Error de conexión');
        }
    },

    register: async (email: string, password: string, tenantName: string): Promise<boolean> => {
        try {
            const response = await fetch(`${API_URL}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, tenantName })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            return true;
        } catch (error: any) {
            throw new Error(error.message || 'Error al registrar');
        }
    },

    logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem('lan_center_user');
        localStorage.removeItem('lan_center_settings');
        window.location.reload();
    },

    getUser: (): User | null => {
        const u = localStorage.getItem('lan_center_user');
        return u ? JSON.parse(u) : null;
    },

    getToken: (): string | null => {
        return localStorage.getItem(AUTH_TOKEN_KEY);
    }
};
