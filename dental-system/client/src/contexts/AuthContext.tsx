import React, { createContext, useContext, useState, useEffect } from 'react'
import { type MockAccount, generateMockAccounts } from '../lib/mockData'

type AuthContextType = {
    currentUser: MockAccount | null
    isAuthenticated: boolean
    login: (email: string, password: string) => Promise<{ success: boolean; account?: MockAccount | null, error?: 'not_found' | 'locked' | 'wrong_password' }>
    register: (data: Partial<MockAccount>) => Promise<boolean>
    logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<MockAccount | null>(null)
    const [accounts, setAccounts] = useState<MockAccount[]>([])

    // Khởi tạo mock data accounts khi app load
    useEffect(() => {
        setAccounts(generateMockAccounts(15))
    }, [])

    const login = async (email: string, password: string) => {
        console.log('AuthContext: Attempting login for email:', email);
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        const account = accounts.find((acc) => acc.email === email)
        if (!account) {
            console.log('AuthContext: Login failed - account not found for email:', email);
            return { success: false, error: 'not_found' };
        }
        if (account.password !== password) {
            console.log('AuthContext: Login failed - wrong password for email:', email);
            return { success: false, error: 'wrong_password' };
        }
        if (account.status !== 'Hoat dong') {
            console.log('AuthContext: Login failed - account locked for email:', email);
            return { success: false, error: 'locked' };
        }
        setCurrentUser(account)
        console.log('AuthContext: Login successful for user:', account.fullName);
        return { success: true, account: account };
    }

    const register = async (data: Partial<MockAccount>) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        const newAccount: MockAccount = {
            id: `acc-${Date.now()}`,
            username: data.email?.split('@')[0] || '',
            fullName: data.fullName || '',
            email: data.email || '',
            role: data.role as 'Admin' | 'Doctor' | 'Reception',
            status: 'Hoat dong',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            dateOfBirth: data.dateOfBirth,
            hometown: data.hometown, 
            address: data.address,
            password: data.password || 'password123', // Lưu mật khẩu
            // Nếu là bác sĩ, trong thực tế sẽ gọi API tạo thêm Doctor Profile
            referenceId: data.role === 'Doctor' ? `doc-${Date.now()}` : undefined
        }
        
        setAccounts((prev) => [...prev, newAccount])
        setCurrentUser(newAccount) // Tự động đăng nhập sau khi đăng ký
        console.log('AuthContext: User registered and logged in:', newAccount.fullName);
        return true
    }

    const logout = () => {
        console.log('AuthContext: Calling logout...');
        setCurrentUser(null)
        console.log('AuthContext: currentUser set to null. User is now logged out.');
    }

    const isAuthenticated = !!currentUser; // Định nghĩa isAuthenticated ở đây
    useEffect(() => {
        console.log('AuthContext: currentUser changed:', currentUser);
        console.log('AuthContext: isAuthenticated changed:', isAuthenticated);
    }, [currentUser]); // Chỉ cần phụ thuộc vào currentUser

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated,
            login,
            register,
            logout
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}