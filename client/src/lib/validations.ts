// Username validation: lowercase + dots only, min 4 chars
export function validateUsername(username: string): { valid: boolean; error?: string } {
    if (!username || username.length < 4) {
        return { valid: false, error: 'Username phải có ít nhất 4 ký tự' }
    }
    if (!/^[a-z.]+$/.test(username)) {
        return { valid: false, error: 'Username chỉ được chứa chữ thường và dấu chấm' }
    }
    return { valid: true }
}

// Email validation
export function validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email) {
        return { valid: false, error: 'Email không được để trống' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Email không đúng định dạng' }
    }
    return { valid: true }
}

// Password validation: min 8 chars, 1 uppercase, 1 number
export function validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
        return { valid: false, error: 'Mật khẩu phải có ít nhất 8 ký tự' }
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải chứa ít nhất 1 chữ hoa' }
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Mật khẩu phải chứa ít nhất 1 chữ số' }
    }
    return { valid: true }
}

// Phone validation: VN format 0xxxxxxxxx
export function validatePhoneVN(phone: string): { valid: boolean; error?: string } {
    if (!phone) {
        return { valid: false, error: 'Số điện thoại không được để trống' }
    }
    if (!/^0\d{9}$/.test(phone)) {
        return { valid: false, error: 'Số điện thoại phải có định dạng: 0xxxxxxxxx' }
    }
    return { valid: true }
}

// License number validation: BS-XXXXX format
export function validateLicenseNumber(licenseNumber: string): { valid: boolean; error?: string } {
    if (!licenseNumber) {
        return { valid: false, error: 'Số giấy phép không được để trống' }
    }
    if (!/^BS-\d{5}$/.test(licenseNumber.toUpperCase())) {
        return { valid: false, error: 'Số giấy phép phải có định dạng: BS-XXXXX' }
    }
    return { valid: true }
}

// Tax ID validation: 10 or 13 digits
export function validateTaxId(taxId: string): { valid: boolean; error?: string } {
    if (!taxId) {
        return { valid: false, error: 'Mã số thuế không được để trống' }
    }
    if (!/^\d{10}$|^\d{13}$/.test(taxId)) {
        return { valid: false, error: 'Mã số thuế phải là 10 hoặc 13 chữ số' }
    }
    return { valid: true }
}

// License practice number validation: GP-XXXXXXXX
export function validatePracticeLicenseNumber(licenseNumber: string): { valid: boolean; error?: string } {
    if (!licenseNumber) {
        return { valid: false, error: 'Số giấy phép hành nghề không được để trống' }
    }
    if (!/^GP-\d{8}$/.test(licenseNumber.toUpperCase())) {
        return { valid: false, error: 'Số giấy phép phải có định dạng: GP-XXXXXXXX' }
    }
    return { valid: true }
}

// URL validation
export function validateURL(url: string): { valid: boolean; error?: string } {
    if (!url) {
        return { valid: true } // Optional field
    }
    try {
        new URL(url)
        return { valid: true }
    } catch {
        return { valid: false, error: 'URL không hợp lệ' }
    }
}

// Required field validation
export function validateRequired(value: string, fieldName: string): { valid: boolean; error?: string } {
    if (!value || !value.trim()) {
        return { valid: false, error: `${fieldName} không được để trống` }
    }
    return { valid: true }
}

// Number range validation
export function validateNumberRange(value: number | string, min: number, max: number, fieldName: string): { valid: boolean; error?: string } {
    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} phải là một số` }
    }
    if (num < min || num > max) {
        return { valid: false, error: `${fieldName} phải nằm trong khoảng ${min} - ${max}` }
    }
    return { valid: true }
}

// Date comparison: endDate must be after startDate
export function validateDateRange(startDate: Date | string, endDate: Date | string): { valid: boolean; error?: string } {
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end <= start) {
        return { valid: false, error: 'Ngày kết thúc phải sau ngày bắt đầu' }
    }
    return { valid: true }
}
