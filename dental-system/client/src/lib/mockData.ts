// Account mock data
export type MockAccount = {
    id: string
    username: string
    fullName: string
    email: string
    role: 'Admin' | 'Doctor' | 'Reception'
    status: 'Hoat dong' | 'Bi khoa'
    lastLogin: string
    createdAt: string
    dateOfBirth?: string
    hometown?: string
    address?: string
    referenceId?: string // ID liên kết (ví dụ: doctorId)
    password?: string // Thêm trường mật khẩu
}

// Audit log mock data
export type MockAuditLog = {
    id: string
    timestamp: string
    account: string
    action: 'Đăng nhập' | 'Đổi mật khẩu' | 'Tạo tài khoản' | 'Khóa tài khoản' | 'Sửa tài khoản'
    ipAddress: string
    result: 'Thành công' | 'Thất bại'
}

// Doctor mock data
export type MockDoctor = {
    id: string
    fullName: string
    licenseNumber: string
    phone: string
    email: string
    specialty: 'Nha khoa tổng quát' | 'Niềng răng' | 'Implant' | 'Nhổ răng' | 'Nha chu'
    degree: 'Bác sĩ' | 'Thạc sĩ' | 'Tiến sĩ' | 'Phó Giáo sư' | 'Giáo sư'
    experience: number
    room: string
    consultationFee: number
    hourlyRate?: number
    serviceCommissionRate?: number
    status: 'active' | 'inactive'
    schedule: Record<string, { enabled: boolean; startTime: string; endTime: string }>
}

// Service mock data
export type MockService = {
    id: string
    name: string
    code: string
    category: 'Khám' | 'Điều trị' | 'Phẫu thuật' | 'Thẩm mỹ' | 'Vệ sinh'
    unit: 'răng' | 'hàm' | 'lần' | 'liệu trình'
    duration: number
    basePrice: number
    status: 'active' | 'inactive'
    description: string
}

// Pricing policy mock data
export type MockPricingPolicy = {
    id: string
    serviceId: string
    serviceName: string
    type: 'Niêm yết' | 'Bảo hiểm' | 'Ưu đãi' | 'VIP'
    price: number
    effectiveDate: string
    expiryDate: string
    status: 'active' | 'inactive'
}

export type MockDoctorShift = {
    id: string
    doctorId: string
    doctorName: string
    date: string
    startTime: string
    endTime: string
}

// Patient mock data
export type MockPatient = {
    id: string
    fullName: string
    phone: string
    dateOfBirth: string // ISO string
    gender: 'Nam' | 'Nữ' | 'Khác'
    address: string
    createdAt: string // ISO string
    allergies?: string[]
}

// Work Shift mock data
export type MockWorkShift = {
    id: string
    name: string
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
}

// Clinic Holiday mock data
export type MockClinicHoliday = {
    id: string
    name: string
    date: string // ISO string (date only)
    isRecurring: boolean
}

// Appointment mock data
export type MockAppointment = {
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
    notes: string
    checkInTime?: string // ISO string
}

// Recent activity mock data
export type MockActivity = {
    id: string
    timestamp: string
    type: string
    description: string
    performer: string
}
