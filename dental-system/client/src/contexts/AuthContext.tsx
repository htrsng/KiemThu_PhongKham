import React, { createContext, useContext, useState, useEffect } from 'react'
import { type MockAccount, generateMockAccounts } from '../lib/mockData'

type AuthContextType = {
    currentUser: MockAccount | null
    isAuthenticated: boolean
    login: (email: string) => Promise<boolean>
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

    const login = async (email: string) => {
        // Giả lập call API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        
        // Trong thực tế, bạn sẽ gửi email/password lên server
        const account = accounts.find((acc) => acc.email === email)
        if (account && account.status === 'Hoat dong') {
            setCurrentUser(account)
            return true
        }
        return false
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
            // Nếu là bác sĩ, trong thực tế sẽ gọi API tạo thêm Doctor Profile
            referenceId: data.role === 'Doctor' ? `doc-${Date.now()}` : undefined
        }
        
        setAccounts((prev) => [...prev, newAccount])
        setCurrentUser(newAccount) // Tự động đăng nhập sau khi đăng ký
        return true
    }

    const logout = () => {
        setCurrentUser(null)
    }

    return (
        <AuthContext.Provider value={{
            currentUser,
            isAuthenticated: !!currentUser,
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