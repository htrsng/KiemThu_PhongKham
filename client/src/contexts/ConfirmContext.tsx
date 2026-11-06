/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useState } from 'react'
import { AlertCircle, X } from 'lucide-react'

type ConfirmOptions = {
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    isDangerous?: boolean
}

type ConfirmContextType = {
    confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [dialog, setDialog] = useState<{ options: ConfirmOptions; resolve: (value: boolean) => void } | null>(null)

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setDialog({ options, resolve })
        })
    }, [])

    const handleConfirm = () => {
        if (dialog) {
            dialog.resolve(true)
            setDialog(null)
        }
    }

    const handleCancel = () => {
        if (dialog) {
            dialog.resolve(false)
            setDialog(null)
        }
    }

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {dialog && (
                <ConfirmDialog
                    options={dialog.options}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    )
}

export function useConfirm() {
    const context = useContext(ConfirmContext)
    if (context === undefined) {
        throw new Error('useConfirm must be used within ConfirmProvider')
    }
    return context
}

function ConfirmDialog({ options, onConfirm, onCancel }: {
    options: ConfirmOptions
    onConfirm: () => void
    onCancel: () => void
}) {
    const {
        title,
        message,
        confirmLabel = 'Xác nhận',
        cancelLabel = 'Hủy',
        isDangerous = false,
    } = options

    const confirmBtnClass = isDangerous
        ? 'bg-rose-600 hover:bg-rose-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
                <div className="flex items-start gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDangerous ? 'bg-rose-100' : 'bg-blue-100'}`}>
                        <AlertCircle className={`h-5 w-5 ${isDangerous ? 'text-rose-600' : 'text-blue-600'}`} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                        <p className="mt-1 text-sm text-slate-600">{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-slate-400 hover:text-slate-600"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium ${confirmBtnClass}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    )
}
