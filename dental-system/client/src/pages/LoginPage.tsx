import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Stethoscope, UserCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export function LoginPage() {
    const navigate = useNavigate()
    const { login, register } = useAuth()
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState('')
    
    // Form states
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState<'Doctor' | 'Reception'>('Doctor')
    const [dateOfBirth, setDateOfBirth] = useState('')
    const [hometown, setHometown] = useState('')
    const [address, setAddress] = useState('')
    const { isAuthenticated } = useAuth(); // Lấy isAuthenticated từ context

    useEffect(() => {
        console.log('LoginPage: isAuthenticated state:', isAuthenticated);
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            if (isLogin) {
                const result = await login(email, password)
                if (result.success && result.account) {
                    // Logic cụ thể cho tài khoản bác sĩ sau khi đăng nhập thành công
                    if (result.account.role === 'Doctor') {
                        console.log(`Bác sĩ ${result.account.fullName} đã đăng nhập thành công!`);
                        // Bạn có thể thêm điều hướng riêng cho bác sĩ tại đây nếu cần,
                        // ví dụ: navigate('/doctor-dashboard');
                    }
                    navigate('/')
                } else {
                    switch (result.error) {
                        case 'not_found':
                        case 'wrong_password':
                            setError('Email hoặc mật khẩu không chính xác.');
                            break;
                        case 'locked':
                            setError('Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên.');
                            break;
                        default:
                            setError('Đã có lỗi xảy ra trong quá trình đăng nhập.');
                    }
                }
            } else {
                const result = await register({ email, fullName, role, dateOfBirth, hometown, address, password })
                if (result.success) {
                    // Đăng ký thành công sẽ tự động đăng nhập và chuyển hướng
                    navigate('/')
                } else {
                    // Xử lý lỗi đăng ký
                    setError(result.error === 'email_exists' ? 'Email này đã được sử dụng.' : 'Đã có lỗi xảy ra khi đăng ký.');
                }
            }
        } catch (err) {
            setError('Đã có lỗi xảy ra')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl border border-slate-100"
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg mb-4">
                        <Stethoscope className="h-8 w-8" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">SmileCare System</h1>
                    <p className="text-slate-500 mt-2">
                        {isLogin ? 'Đăng nhập vào hệ thống quản lý' : 'Tạo tài khoản mới'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-rose-50 p-3 text-sm text-rose-600 border border-rose-200">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                                <input
                                    required
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    placeholder="Nguyễn Văn A"
                                />
                                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as typeof role)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                >
                                    <option value="Doctor">Bác sĩ</option>
                                    <option value="Reception">Lễ tân</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Ngày sinh</label>
                                    <input
                                        required
                                        type="date"
                                        value={dateOfBirth}
                                        onChange={(e) => setDateOfBirth(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quê quán</label>
                                    <input
                                        required
                                        type="text"
                                        value={hometown}
                                        onChange={(e) => setHometown(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                        placeholder="VD: Hà Nội"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                                <input
                                    required
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email đăng nhập</label>
                        <div className="relative">
                            <UserCircle className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                            <input
                                required
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 pl-11 pr-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                                placeholder={isLogin ? "admin@gmail.com" : "vidu@gmail.com"}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                        <input
                            required
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
                    >
                        {isLogin ? 'Đăng nhập' : 'Đăng ký tài khoản'}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm">
                    <span className="text-slate-500">
                        {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                    </span>{' '}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin)
                            setError('')
                        }}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}