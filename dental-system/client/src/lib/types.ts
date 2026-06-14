// Account mock data
export type Account = {
    id: string
    username: string
    fullName: string
    email: string
    role: 'Admin' | 'Doctor' | 'Reception'
    status: 'active' | 'locked'
    lastLoginAt?: string
    createdAt: string
    dateOfBirth?: string
    hometown?: string
    address?: string
    referenceId?: string // ID liên kết (ví dụ: doctorId)
    password?: string // Thêm trường mật khẩu
}

// Audit log mock data
export type AuditLog = {
    id: string
    timestamp: string
    account: string
    action: 'Đăng nhập' | 'Đổi mật khẩu' | 'Tạo tài khoản' | 'Khóa tài khoản' | 'Sửa tài khoản'
    ipAddress: string
    result: 'Thành công' | 'Thất bại'
}

// Doctor mock data
export type Doctor = {
    id: string
    fullName: string
    licenseNumber: string
    phone: string
    email: string
    specialty: 'Nha khoa tổng quát' | 'Niềng răng' | 'Implant' | 'Nhổ răng' | 'Nha chu'
    degree: 'Đại học' | 'Thạc sỹ' | 'Tiến sỹ' | 'Phó giáo sư' | 'Giáo sư'
    experience: number
    consultationFee: number
    hourlyRate: number
    serviceCommissionRate?: number
    status: 'active' | 'inactive'
    schedule: Record<string, { enabled: boolean; startTime: string; endTime: string }>
}

// Service mock data
export type Service = {
    id: string
    name: string
    code: string
    category: 'Khám' | 'Điều trị' | 'Phẫu thuật' | 'Thẩm mỹ' | 'Vệ sinh'
    unit: 'răng' | 'hàm' | 'lần' | 'liệu trình'
    duration: number
    difficulty: number
    basePrice: number
    status: 'active' | 'inactive'
    description: string
}

// Pricing policy mock data
export type PricingPolicy = {
    id: string
    serviceId: string
    serviceName: string
    type: 'Niêm yết' | 'Bảo hiểm' | 'Ưu đãi' | 'VIP'
    price: number
    effectiveDate: string
    expiryDate: string
    status: 'active' | 'inactive'
}

export type DoctorShift = {
    id: string
    doctorId: string
    doctorName: string
    date: string
    startTime: string
    endTime: string
    coefficient: number
}

// Patient mock data
export type Patient = {
    id: string
    patientCode?: string
    fullName: string
    phone: string
    dateOfBirth: string // ISO string
    gender: 'Nam' | 'Nữ' | 'Khác' | string
    address: string
    createdAt?: string // ISO string
    
    // Additional identity
    cccd?: string
    email?: string
    avatarUrl?: string
    
    // Medical Info
    bloodType?: string
    allergies?: string[]
    backgroundDisease?: string
    surgicalHistory?: string
    currentMedication?: string
    height?: number
    weight?: number
    bmi?: number
    
    // Emergency Contact
    emergencyContactName?: string
    emergencyContactRelation?: string
    emergencyContactPhone?: string
    
    // Insurance
    insuranceNumber?: string
    insurancePlace?: string
    insuranceExpirationDate?: string // ISO string

    // System Info
    updatedAt?: string
    updatedBy?: string
    doctorNotes?: string
}

// Work Shift mock data
export type WorkShift = {
    id: string
    name: string
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
}

// Clinic Holiday mock data
export type ClinicHoliday = {
    id: string
    date: string
    name: string
    description?: string
    isRecurring?: boolean
    type?: 'HOLIDAY' | 'MAINTENANCE' | 'TRAINING' | 'SYSTEM_CLOSED'
}

// Appointment mock data
export type Appointment = {
    id: string
    patientId: string
    patientName: string
    doctorId: string
    doctorName: string
    serviceId: string
    serviceName: string
    startTime: string // ISO string
    endTime: string // ISO string
    status: 'Đã lên lịch' | 'Đã đến' | 'Đang điều trị' | 'Đã hoàn thành' | 'Đã hủy'
    notes?: string
    difficulty: number
    checkInTime?: string // ISO string
}

// Recent activity mock data
export type Activity = {
    id: string
    timestamp: string
    type: string
    description: string
    performer: string
}
