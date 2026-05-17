import React, { createContext, useContext, useState, useEffect } from 'react';
import type { 
    MockDoctor,
    MockAppointment,
    MockService,
    MockDoctorShift,
} from '../lib/mockData';

// These types will be used across the app during migration
export type Doctor = MockDoctor;
export type Appointment = MockAppointment;
export type Service = MockService;
export type Shift = MockDoctorShift;
export type DoctorPayload = Omit<Doctor, 'id' | 'schedule'>;

interface DataContextType {
    isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            // This context is now a placeholder. Data is fetched in individual components.
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần

    const value = { isLoading };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};