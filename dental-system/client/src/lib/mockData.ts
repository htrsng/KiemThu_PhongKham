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
}

export function generateMockAccounts(count: number = 15): MockAccount[] {
    const roles = ['Admin', 'Doctor', 'Reception'] as const
    const lastNames = ['Nguyễn', 'Trần', 'Hoàng', 'Phạm', 'Võ', 'Vũ', 'Tạ', 'Đặng']
    const firstNames = ['Văn A', 'Thị B', 'Minh C', 'Hùng D', 'Linh E', 'Tuấn F', 'Hà G']
    const cities = ['Hà Nội', 'TP.HCM', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ']

    const randomAccounts: MockAccount[] = Array.from({ length: count }, (_, index) => {
        const firstName = firstNames[index % firstNames.length]
        const lastName = lastNames[index % lastNames.length]
        const fullName = `${lastName} ${firstName}`
        const username = `${lastName.toLowerCase()}.${firstName.toLowerCase().replace(/\s/g, '')}`
        const email = `${username}@smilecare.vn`
        const role = roles[index % roles.length]
        const status = index % 4 === 0 ? 'Bi khoa' : 'Hoat dong'
        const daysAgo = Math.floor(Math.random() * 30)
        const lastLogin = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
        const createdAt = new Date(Date.now() - (daysAgo + Math.floor(Math.random() * 60)) * 24 * 60 * 60 * 1000)
        const birthYear = new Date().getFullYear() - (Math.floor(Math.random() * 30) + 22)
        const birthMonth = Math.floor(Math.random() * 12)
        const birthDay = Math.floor(Math.random() * 28) + 1
        const dateOfBirth = new Date(birthYear, birthMonth, birthDay).toISOString()


        return {
            id: `acc-${String(index + 1).padStart(3, '0')}`,
            username,
            fullName,
            email,
            role,
            status,
            lastLogin: lastLogin.toISOString(),
            createdAt: createdAt.toISOString(),
            dateOfBirth,
            hometown: cities[index % cities.length],
            address: `${Math.floor(Math.random() * 100) + 1} Đường ABC, ${cities[index % cities.length]}`,
            referenceId: role === 'Doctor' ? `doc-${String(index + 1).padStart(3, '0')}` : undefined
        }
    })

    // Thêm tài khoản admin tĩnh theo yêu cầu
    const adminAccount: MockAccount = {
        id: 'acc-admin-999',
        username: 'admin',
        fullName: 'System Admin',
        email: 'admin@gmail.com',
        role: 'Admin',
        status: 'Hoat dong',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        hometown: 'Hà Nội',
        address: 'Hà Nội'
    }

    return [adminAccount, ...randomAccounts]
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

export function generateMockAuditLogs(count: number = 20): MockAuditLog[] {
    const actions = ['Đăng nhập', 'Đổi mật khẩu', 'Tạo tài khoản', 'Khóa tài khoản', 'Sửa tài khoản'] as const
    const accounts = ['admin.user', 'doctor.hung', 'reception.linh', 'admin.tuan']

    return Array.from({ length: count }, (_, index) => {
        const hoursAgo = Math.floor(Math.random() * 72)
        const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
        const action = actions[index % actions.length]
        const result = index % 5 === 0 ? 'Thất bại' : 'Thành công'
        const octet3 = Math.floor(Math.random() * 256)
        const octet4 = Math.floor(Math.random() * 256)
        const ipAddress = `192.168.${octet3}.${octet4}`

        return {
            id: `log-${String(index + 1).padStart(3, '0')}`,
            timestamp: timestamp.toISOString(),
            account: accounts[index % accounts.length],
            action,
            ipAddress,
            result,
        }
    })
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
    status: 'active' | 'inactive'
    schedule: Record<string, { enabled: boolean; startTime: string; endTime: string }>
}

export function generateMockDoctors(count: number = 9): MockDoctor[] {
    const specialties = ['Nha khoa tổng quát', 'Niềng răng', 'Implant', 'Nhổ răng', 'Nha chu'] as const
    const degrees = ['Bác sĩ', 'Thạc sĩ', 'Tiến sĩ', 'Phó Giáo sư', 'Giáo sư'] as const
    const rooms = ['101', '102', '103', '201', '202', '203', '301', '302', '303', '304', '305']
    const lastNames = ['Nguyễn', 'Trần', 'Hoàng', 'Phạm', 'Võ', 'Vũ', 'Tạ', 'Đặng', 'Bùi']
    const firstNames = ['Văn A', 'Thị B', 'Minh C', 'Hùng D', 'Linh E', 'Tuấn F', 'Hà G', 'Duy H', 'Kiên I']

    return Array.from({ length: count }, (_, index) => {
        const firstName = firstNames[index % firstNames.length]
        const lastName = lastNames[index % lastNames.length]
        const fullName = `${lastName} ${firstName}`
        const specialty = specialties[index % specialties.length]
        const degree = degrees[index % degrees.length]
        const room = rooms[index % rooms.length]
        const experience = Math.floor(Math.random() * 30) + 2
        const phone = `0${Math.floor(Math.random() * 900000000) + 100000000}`
        const email = `${lastName.toLowerCase()}.${firstName.toLowerCase().replace(/\s/g, '')}@smilecare.vn`
        const licenseNumber = `BS-${String(index + 1).padStart(5, '0')}`
        const consultationFee = (Math.floor(Math.random() * 5) + 2) * 100000
        const status = index % 6 === 0 ? 'inactive' : 'active'
        const schedule = {
            T2: { enabled: true, startTime: '08:00', endTime: '17:00' },
            T3: { enabled: true, startTime: '08:00', endTime: '17:00' },
            T4: { enabled: true, startTime: '08:00', endTime: '17:00' },
            T5: { enabled: true, startTime: '08:00', endTime: '17:00' },
            T6: { enabled: true, startTime: '08:00', endTime: '17:00' },
            T7: { enabled: false, startTime: '09:00', endTime: '16:00' },
            CN: { enabled: false, startTime: '09:00', endTime: '12:00' },
        }

        return {
            id: `doc-${String(index + 1).padStart(3, '0')}`,
            fullName,
            licenseNumber,
            phone,
            email,
            specialty,
            degree,
            experience,
            room: `Phòng ${room}`,
            consultationFee,
            status,
            schedule,
        }
    })
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

export function generateMockServices(count: number = 10): MockService[] {
    const units = ['răng', 'hàm', 'lần', 'liệu trình'] as const
    const services = [
        { name: 'Khám tổng quát', category: 'Khám' as const, duration: 30, basePrice: 200000, description: 'Khám sức khỏe răng miệng toàn bộ' },
        { name: 'Điều trị sâu răng', category: 'Điều trị' as const, duration: 60, basePrice: 500000, description: 'Điều trị sâu răng với vật liệu chất lượng cao' },
        { name: 'Tẩy trắng răng', category: 'Thẩm mỹ' as const, duration: 90, basePrice: 800000, description: 'Tẩy trắng răng an toàn và hiệu quả' },
        { name: 'Cảy implant', category: 'Phẫu thuật' as const, duration: 120, basePrice: 25000000, description: 'Cần implant thay thế răng mất' },
        { name: 'Niềng răng', category: 'Điều trị' as const, duration: 60, basePrice: 15000000, description: 'Niềng răng để chỉnh sửa khớp cắn' },
        { name: 'Vệ sinh cao', category: 'Vệ sinh' as const, duration: 45, basePrice: 300000, description: 'Vệ sinh sâu loại bỏ cao răng' },
        { name: 'Nhổ răng', category: 'Phẫu thuật' as const, duration: 30, basePrice: 500000, description: 'Nhổ răng an toàn' },
        { name: 'Hàn nha chu', category: 'Điều trị' as const, duration: 45, basePrice: 400000, description: 'Điều trị bệnh nha chu' },
        { name: 'Làm sạch cao thận kinh', category: 'Vệ sinh' as const, duration: 30, basePrice: 250000, description: 'Vệ sinh loại bỏ cao thúng' },
        { name: 'Phục hình răng', category: 'Thẩm mỹ' as const, duration: 90, basePrice: 3000000, description: 'Phục hình cầu hay mặt dán sứ' },
    ]

    return services.slice(0, count).map((service, index) => ({
        id: `srv-${String(index + 1).padStart(3, '0')}`,
        name: service.name,
        code: `DV-${String(index + 1).padStart(3, '0')}`,
        category: service.category,
        unit: units[Math.floor(Math.random() * units.length)],
        duration: service.duration,
        basePrice: service.basePrice,
        status: index % 8 === 0 ? 'inactive' : 'active',
        description: service.description,
    }))
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

export function generateMockPricingPolicies(count: number = 15): MockPricingPolicy[] {
    const services = generateMockServices(10)
    const types = ['Niêm yết', 'Bảo hiểm', 'Ưu đãi', 'VIP'] as const

    return Array.from({ length: count }, (_, index) => {
        const service = services[index % services.length]
        const type = types[index % types.length]
        const priceMultiplier = {
            'Niêm yết': 1,
            'Bảo hiểm': 0.8,
            'Ưu đãi': 0.7,
            'VIP': 1.2,
        }[type]

        const effectiveDate = new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000)
        const expiryDate = new Date(effectiveDate.getTime() + 180 * 24 * 60 * 60 * 1000)

        return {
            id: `pp-${String(index + 1).padStart(3, '0')}`,
            serviceId: service.id,
            serviceName: service.name,
            type,
            price: Math.round(service.basePrice * priceMultiplier),
            effectiveDate: effectiveDate.toISOString(),
            expiryDate: expiryDate.toISOString(),
            status: expiryDate > new Date() ? 'active' : 'inactive',
        }
    })
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
}

export function generateMockPatients(count: number = 20): MockPatient[] {
    const lastNames = ['Lê', 'Phan', 'Đỗ', 'Bùi', 'Đinh', 'Hồ']
    const firstNames = ['Quỳnh Anh', 'Gia Bảo', 'Minh Khang', 'Tuệ Nhi', 'Đức Huy', 'Phương Mai']
    const genders = ['Nam', 'Nữ', 'Khác'] as const
    const cities = ['Hà Nội', 'Đà Nẵng', 'TP.HCM', 'Cần Thơ', 'Hải Phòng']

    return Array.from({ length: count }, (_, index) => {
        const firstName = firstNames[index % firstNames.length]
        const lastName = lastNames[index % lastNames.length]
        const fullName = `${lastName} ${firstName}`
        const phone = `09${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`
        const birthYear = new Date().getFullYear() - (Math.floor(Math.random() * 60) + 5)
        const birthMonth = Math.floor(Math.random() * 12)
        const birthDay = Math.floor(Math.random() * 28) + 1
        const dateOfBirth = new Date(birthYear, birthMonth, birthDay).toISOString()
        const createdAt = new Date(Date.now() - Math.floor(Math.random() * 365) * 24 * 60 * 60 * 1000).toISOString()

        return {
            id: `pat-${String(index + 1).padStart(3, '0')}`,
            fullName,
            phone,
            dateOfBirth,
            gender: genders[index % genders.length],
            address: `${Math.floor(Math.random() * 100) + 1} Đường ABC, ${cities[index % cities.length]}`,
            createdAt,
        }
    })
}

// Work Shift mock data
export type MockWorkShift = {
    id: string
    name: string
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
}

export function generateMockWorkShifts(): MockWorkShift[] {
    return [
        { id: 'shift-1', name: 'Ca Sáng', startTime: '08:00', endTime: '12:00' },
        { id: 'shift-2', name: 'Ca Chiều', startTime: '13:00', endTime: '17:00' },
        { id: 'shift-3', name: 'Ca Tối', startTime: '17:00', endTime: '20:00' },
        { id: 'shift-4', name: 'Cả ngày', startTime: '08:00', endTime: '17:00' },
    ]
}

// Clinic Holiday mock data
export type MockClinicHoliday = {
    id: string
    name: string
    date: string // ISO string (date only)
    isRecurring: boolean
}

export function generateMockClinicHolidays(): MockClinicHoliday[] {
    const currentYear = new Date().getFullYear()
    return [
        {
            id: 'holiday-1',
            name: 'Nghỉ Tết Dương Lịch',
            date: new Date(currentYear, 0, 1).toISOString().split('T')[0],
            isRecurring: true,
        },
        {
            id: 'holiday-2',
            name: 'Nghỉ lễ 30/4',
            date: new Date(currentYear, 3, 30).toISOString().split('T')[0],
            isRecurring: true,
        },
        {
            id: 'holiday-3',
            name: 'Nghỉ lễ Quốc tế Lao động',
            date: new Date(currentYear, 4, 1).toISOString().split('T')[0],
            isRecurring: true,
        },
        {
            id: 'holiday-4',
            name: 'Bảo trì hệ thống',
            date: new Date(currentYear, 6, 15).toISOString().split('T')[0],
            isRecurring: false,
        },
    ]
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
    status: 'Đã lên lịch' | 'Đã hoàn thành' | 'Đã hủy'
    notes: string
}

export function generateMockAppointments(count: number = 30): MockAppointment[] {
    const patients = generateMockPatients(20)
    const doctors = generateMockDoctors(9).filter((d) => d.status === 'active')
    const services = generateMockServices(10)
    const statuses = ['Đã lên lịch', 'Đã hoàn thành', 'Đã hủy'] as const
    const notes = ['Bệnh nhân có tiền sử dị ứng', 'Cần chụp X-quang', 'Tái khám sau 1 tuần', '']

    return Array.from({ length: count }, (_, index) => {
        const patient = patients[index % patients.length]
        const doctor = doctors[index % doctors.length]
        const service = services[index % services.length]
        const status = statuses[index % statuses.length]

        const daysFromNow = Math.floor(Math.random() * 30) - 15 // -15 to +15 days from today
        const hour = Math.floor(Math.random() * 9) + 8 // 8am to 4pm
        const startTime = new Date()
        startTime.setDate(startTime.getDate() + daysFromNow)
        startTime.setHours(hour, 0, 0, 0)

        const endTime = new Date(startTime.getTime() + service.duration * 60 * 1000)

        return {
            id: `apt-${String(index + 1).padStart(3, '0')}`,
            patientId: patient.id,
            patientName: patient.fullName,
            doctorId: doctor.id,
            doctorName: doctor.fullName,
            serviceId: service.id,
            serviceName: service.name,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            status,
            notes: notes[index % notes.length],
        }
    })
}

// Recent activity mock data
export type MockActivity = {
    id: string
    timestamp: string
    type: string
    description: string
    performer: string
}

export function generateMockActivities(count: number = 5): MockActivity[] {
    const activityTypes = [
        { type: 'Tạo tài khoản', description: 'Tạo tài khoản mới: %s' },
        { type: 'Cập nhật bác sĩ', description: 'Cập nhật thông tin bác sĩ: %s' },
        { type: 'Tạo dịch vụ', description: 'Thêm dịch vụ mới: %s' },
        { type: 'Lên lịch khám', description: 'Lên lịch khám cho bệnh nhân: %s' },
        { type: 'Cập nhật chính sách giá', description: 'Cập nhật giá dịch vụ: %s' },
    ]
    const performers = ['admin.user', 'doctor.hung', 'reception.linh']
    const services = ['Khám tổng quát', 'Điều trị sâu', 'Tẩy trắng', 'Niềng răng']

    return Array.from({ length: count }, (_, index) => {
        const activity = activityTypes[index % activityTypes.length]
        const hoursAgo = Math.floor(Math.random() * 24)
        const timestamp = new Date(Date.now() - hoursAgo * 60 * 60 * 1000)

        return {
            id: `act-${String(index + 1).padStart(3, '0')}`,
            timestamp: timestamp.toISOString(),
            type: activity.type,
            description: activity.description.replace('%s', services[index % services.length]),
            performer: performers[index % performers.length],
        }
    })
}
