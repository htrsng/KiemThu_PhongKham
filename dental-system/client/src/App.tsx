import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { ConfirmProvider } from './contexts/ConfirmContext'
import { DataProvider } from './contexts/DataContext'
import { AppRouter } from './routes/AppRouter'

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <ConfirmProvider>
                    <DataProvider>
                        <AppRouter />
                    </DataProvider>
                </ConfirmProvider>
            </ToastProvider>
        </AuthProvider>
    )
}