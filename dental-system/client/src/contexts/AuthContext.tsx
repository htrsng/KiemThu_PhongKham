import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, type ApiItemResponse } from '../lib/api';
import { type MockAccount } from '../lib/mockData';

interface LoginResponse {
    token: string;
    account: MockAccount;
}

interface AuthResult {
    success: boolean;
    account?: MockAccount;
    error?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: MockAccount | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<AuthResult>;
    logout: () => void;
    register: (data: Partial<MockAccount>) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<MockAccount | null>(null);
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
                const response = await api.get<ApiItemResponse<MockAccount>>('/auth/me');
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

    const register = async (data: Partial<MockAccount>): Promise<AuthResult> => {
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