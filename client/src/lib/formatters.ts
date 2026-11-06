// Format currency to VND
export function formatVND(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(amount)
}

// Format phone number
export function formatPhone(phone: string): string {
    if (!phone) return ''
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
}

// Format date
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
    const d = new Date(date)
    const options: Intl.DateTimeFormatOptions = format === 'short'
        ? { year: 'numeric', month: '2-digit', day: '2-digit' }
        : { year: 'numeric', month: 'long', day: 'numeric' }
    return d.toLocaleDateString('vi-VN', options)
}

// Format time (HH:MM)
export function formatTime(time: string): string {
    if (!time) return ''
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
}

// Format datetime
export function formatDateTime(date: Date | string): string {
    const d = new Date(date)
    const datePart = d.toLocaleDateString('vi-VN')
    const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    return `${datePart} ${timePart}`
}

// Format datetime for <input type="datetime-local">
export function formatDateTimeLocal(date: Date | string): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Get relative time (e.g., "2 giờ trước")
export function getRelativeTime(date: Date | string): string {
    const d = new Date(date)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (seconds < 60) return 'Vừa xong'
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)} tuần trước`
    
    return formatDate(d, 'long')
}

// Get initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// Get random pastel color
export function getRandomPastelColor(): string {
    const pastelColors = [
        '#FFB3BA', // Red
        '#FFDFBA', // Orange
        '#FFFFBA', // Yellow
        '#BAFFC9', // Green
        '#BAE1FF', // Blue
        '#D9BAFF', // Purple
        '#FFB3E6', // Pink
    ]
    return pastelColors[Math.floor(Math.random() * pastelColors.length)]
}

// Get color by specialty (for doctor avatars)
export function getSpecialtyColor(specialty: string): string {
    const colors: { [key: string]: string } = {
        'Nha khoa tổng quát': '#FFB3BA',
        'Niềng răng': '#FFDFBA',
        'Implant': '#FFFFBA',
        'Nhổ răng': '#BAFFC9',
        'Nha chu': '#BAE1FF',
    }
    return colors[specialty] || '#FFB3BA'
}
