import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    generateMockServices,
    type MockDoctor,
    type MockAppointment,
    type MockService,
    type MockDoctorShift,
} from '../lib/mockData';

// These types will be used across the app during migration
export type Doctor = MockDoctor;
export type Appointment = MockAppointment;
export type Service = MockService;
export type Shift = MockDoctorShift;
export type DoctorPayload = Omit<Doctor, 'id' | 'schedule'>;

interface DataContextType {
    isLoading: boolean;
    // This context now only provides mock data for modules NOT yet connected to the server.
    services: Service[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [services, setServices] = useState<MockService[]>([]);

    useEffect(() => {
        const timer = setTimeout(() => {
            console.log("Generating legacy mock data for services...");
            setServices(generateMockServices(20));
            setIsLoading(false);
        }, 800);

        return () => clearTimeout(timer);
    }, []); // Mảng rỗng đảm bảo useEffect chỉ chạy 1 lần

    const value = { isLoading, services };

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};