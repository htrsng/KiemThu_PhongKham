import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type ApiItemResponse } from '../lib/api';
import { type Account } from '../lib/types';

interface LoginResponse {
    token: string;
    account: Account;
}

interface AuthResult {
    success: boolean;
    account?: Account;
    error?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: Account | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    logout: () => void;
    register: (data: Partial<Account>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) {
                setIsLoading(false);
                return;
            }

            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            try {
                const response = await api.get<ApiItemResponse<Account>>('/auth/me');
                if (response.data?.data) {
                    setCurrentUser(response.data.data);
                } else {
                    localStorage.removeItem('authToken');
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                localStorage.removeItem('authToken');
                delete api.defaults.headers.common['Authorization'];
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = async (email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', { email, password });
            const { token, account } = response.data;

            localStorage.setItem('authToken', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setCurrentUser(account);

            return { success: true, account };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'unknown_error' };
        }
    };

    const register = async (data: Partial<Account>): Promise<AuthResult> => {
        try {
            const response = await api.post<LoginResponse>('/auth/register', data);
            const { token, account } = response.data;

            localStorage.setItem('authToken', token);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setCurrentUser(account);

            return { success: true, account };
        } catch (error: any) {
            return { success: false, error: error.response?.data?.error || 'unknown_error' };
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('authToken');
        delete api.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    };

    const value = { isAuthenticated: !!currentUser, currentUser, isLoading, login, logout, register };

    if (isLoading) {
        return <div className="flex h-screen items-center justify-center">Đang tải ứng dụng...</div>;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}