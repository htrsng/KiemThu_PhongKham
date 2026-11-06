/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
    id: string
    type: ToastType
    message: string
    duration?: number
}

type ToastContextType = {
    toasts: Toast[]
    addToast: (type: ToastType, message: string, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const addToast = useCallback((type: ToastType, message: string, duration = 3000) => {
        const id = Math.random().toString(36).substr(2, 9)
        const newToast: Toast = { id, type, message, duration }

        setToasts((prev) => [...prev, newToast])

        if (duration > 0) {
            setTimeout(() => removeToast(id), duration)
        }
    }, [removeToast])

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (context === undefined) {
        throw new Error('useToast must be used within ToastProvider')
    }
    return context
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
    return (
        <div className="fixed right-4 top-4 z-50 space-y-3">
            {toasts.map((toast) => (
                <ToastItem
                    key={toast.id}
                    toast={toast}
                    onClose={() => onClose(toast.id)}
                />
            ))}
        </div>
    )
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
    const baseClass = 'flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg'
    
    let bgClass = ''
    let iconClass = ''
    let Icon = Info

    switch (toast.type) {
        case 'success':
            bgClass = 'bg-emerald-50 border border-emerald-200'
            iconClass = 'text-emerald-600'
            Icon = CheckCircle
            break
        case 'error':
            bgClass = 'bg-rose-50 border border-rose-200'
            iconClass = 'text-rose-600'
            Icon = AlertCircle
            break
        case 'warning':
            bgClass = 'bg-amber-50 border border-amber-200'
            iconClass = 'text-amber-600'
            Icon = AlertTriangle
            break
        case 'info':
            bgClass = 'bg-blue-50 border border-blue-200'
            iconClass = 'text-blue-600'
            Icon = Info
            break
    }

    const textClass = {
        success: 'text-emerald-700',
        error: 'text-rose-700',
        warning: 'text-amber-700',
        info: 'text-blue-700',
    }[toast.type]

    return (
        <div className={`${baseClass} ${bgClass} max-w-sm animate-slide-in`}>
            <Icon className={`h-5 w-5 flex-shrink-0 ${iconClass} mt-0.5`} />
            <p className={`flex-1 text-sm font-medium ${textClass}`}>
                {toast.message}
            </p>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-slate-400 hover:text-slate-600"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}
