import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api'; 
import { formatVND } from '../lib/formatters'; 
import { BarChart3, Download, Filter, Bell, User } from 'lucide-react'; 
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts';

export function RevenueStatisticsPage() {
    // ---- PHẦN 1: TẠO CÁC BIẾN TRẠNG THÁI (STATE) ĐỂ LƯU DỮ LIỆU ----

    // Biến data dùng để lưu toàn bộ số liệu biểu đồ mà Server sẽ trả về 
    const [data, setData] = useState<{
        summary: { totalRevenue: number; transactionCount: number; averagePerTransaction: number; totalDebt: number };
        revenueByDate: any[];
        paymentMethods: any[];
        revenueByDoctor: any[];
        recentTransactions: any[];
    }>({
        summary: { totalRevenue: 0, transactionCount: 0, averagePerTransaction: 0, totalDebt: 0 },
        revenueByDate: [],
        paymentMethods: [],
        revenueByDoctor: [],
        recentTransactions: []
    });
    
    // Biến filters trữ thông tin bộ lọc người dùng đang chọn
    const [filters, setFilters] = useState({ dateRange: 'today', doctorId: 'all', serviceId: 'all' });
    
    // Biến isMounted để đảm bảo chỉ render biểu đồ sau khi component đã mount hoàn toàn
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsMounted(true), 100);
        return () => clearTimeout(timer);
    }, []);
    
    // Biến isLoading (Báo đang tải) và error (Báo lỗi mạng)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Server-side data for Services (để lấy tên dịch vụ) ---
    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: async () => (await api.get('/services')).data.data,
    });

    // --- Server-side data for Doctors (để đổ vào dropdown lọc) ---
    const { data: doctors = [] } = useQuery({
        queryKey: ['doctors'],
        queryFn: async () => (await api.get('/doctors')).data.data,
    });

    // ---- PHẦN 2: FETCH DỮ LIỆU TỪ SERVER MỖI KHI BỘ LỌC THAY ĐỔI ----
    useEffect(() => {
        // Hàm lấy dữ liệu bất đồng bộ 
        const fetchRevenueData = async () => {
            setIsLoading(true); // 1. Bật trạng thái quay vòng 'Đang tải'
            setError(null); // 2. Xóa lỗi cũ
            
            try {
                // 3. Gọi lệnh Axios tới server
                const res = await api.get('/invoices'); // Lấy tất cả hóa đơn, lọc ở client
                let invoices = res.data.data || [];
                
                // --- LỌC DỮ LIỆU THEO BỘ LỌC NGÀY THÁNG ---
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (filters.dateRange === 'today') {
                    invoices = invoices.filter((inv: any) => new Date(inv.updatedAt || inv.createdAt).toDateString() === today.toDateString());
                } else if (filters.dateRange === 'week') {
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Thứ 2 là đầu tuần
                    invoices = invoices.filter((inv: any) => new Date(inv.updatedAt || inv.createdAt) >= weekStart);
                } else if (filters.dateRange === 'month') {
                    invoices = invoices.filter((inv: any) => {
                        const invDate = new Date(inv.updatedAt || inv.createdAt);
                        return invDate.getMonth() === today.getMonth() && invDate.getFullYear() === today.getFullYear();
                    });
                }

                // --- LỌC DỮ LIỆU THEO BỘ LỌC BÁC SĨ ---
                if (filters.doctorId !== 'all') {
                    invoices = invoices.filter((inv: any) => inv.doctorId === filters.doctorId);
                }

                // --- LỌC DỮ LIỆU THEO BỘ LỌC DỊCH VỤ ---
                if (filters.serviceId !== 'all') {
                    invoices = invoices.filter((inv: any) => inv.serviceIds && inv.serviceIds.includes(filters.serviceId));
                }

                // --- XỬ LÝ, TÍNH TOÁN SỐ LIỆU TỪ DỮ LIỆU THÔ --- 
                const paidInvoices = invoices.filter((i: any) => i.status === 'Đã thanh toán');
                const totalRevenue = paidInvoices.reduce((sum: number, inv: any) => sum + (inv.finalAmount || inv.totalAmount || 0), 0);
                const transactionCount = paidInvoices.length;
                const totalDebt = invoices.filter((i: any) => i.status === 'Chưa thanh toán').reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0);

                // Tính tỷ trọng phương thức thanh toán
                const methodMap = new Map();
                paidInvoices.forEach((i: any) => {
                    const m = i.paymentMethod || 'Tiền mặt';
                    methodMap.set(m, (methodMap.get(m) || 0) + (i.finalAmount || i.totalAmount || 0));
                });
                
                // Tính doanh thu theo ngày cho biểu đồ đường
                const revenueByDateMap = new Map<string, number>();
                paidInvoices.forEach((inv: any) => {
                    const dateStr = new Date(inv.updatedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                    const currentRevenue = revenueByDateMap.get(dateStr) || 0;
                    revenueByDateMap.set(dateStr, currentRevenue + (inv.finalAmount || inv.totalAmount || 0));
                });
                const revenueByDate = Array.from(revenueByDateMap, ([date, revenue]) => ({ date, revenue }))
                    .sort((a, b) => {
                        const [dayA, monthA] = a.date.split('/');
                        const [dayB, monthB] = b.date.split('/');
                        return new Date(`${now.getFullYear()}-${monthA}-${dayA}`).getTime() - new Date(`${now.getFullYear()}-${monthB}-${dayB}`).getTime();
                    });

                // Lấy tên dịch vụ cho các giao dịch gần đây
                const servicesMap = new Map(services.map((s: any) => [s.id, s.name]));
                const recentTransactions = invoices.slice(0, 5).map((tx: any) => ({
                    ...tx,
                    serviceName: tx.serviceIds?.map((id: string) => servicesMap.get(id)).filter(Boolean).join(', ') || 'Dịch vụ tổng hợp'
                }));

                // Tính doanh thu theo bác sĩ
                const doctorRevenueMap = new Map<string, number>();
                paidInvoices.forEach((inv: any) => {
                    const docName = inv.doctorName || 'Khác';
                    doctorRevenueMap.set(docName, (doctorRevenueMap.get(docName) || 0) + (inv.finalAmount || inv.totalAmount || 0));
                });
                const revenueByDoctor = Array.from(doctorRevenueMap, ([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

                // 4. Lưu lại toàn bộ dữ liệu vào state React
                setData({
                    summary: {
                        totalRevenue,
                        transactionCount,
                        averagePerTransaction: transactionCount > 0 ? Math.round(totalRevenue / transactionCount) : 0,
                        totalDebt
                    },
                    revenueByDate,
                    paymentMethods: Array.from(methodMap, ([method, value]) => ({ method, value })),
                    revenueByDoctor,
                    recentTransactions,
                });
                
            } catch (err) {
                setError('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
            } finally {
                setIsLoading(false); 
            }
        };

        if (services !== undefined && doctors !== undefined) { 
            fetchRevenueData();
        }
    }, [filters, services, doctors]); // Thêm doctors vào dependency array

    const PIE_COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e'];

    // ---- PHẦN 3: XUẤT GIAO DIỆN ----
    return (
        <div className="min-h-screen bg-slate-50 p-2 sm:p-6 flex flex-col gap-6 w-full fade-in">
            {/* 1. HEADER CHÍNH */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div>
                    <div className="text-xs text-slate-500 font-medium mb-1">Bảng điều khiển &gt; Thống kê doanh thu</div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Nha Khoa SmileCare</h1>
                </div>
                <div className="flex items-center gap-4">
                    <button className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 relative transition-colors">
                        <Bell className="w-5 h-5 text-slate-600" />
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 cursor-pointer hover:bg-blue-100">
                        <User className="w-5 h-5" />
                        <span className="font-semibold text-sm">Quản trị viên</span>
                    </div>
                </div>
            </div>

            {/* 2. KHUNG BỘ LỌC */}
            <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Filter className="w-5 h-5" /></div>
                    
                    <select 
                        className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none font-medium"
                        value={filters.dateRange}
                        onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    >
                        <option value="today">Hôm nay</option>
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                    </select>

                    <select 
                        className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none font-medium"
                        value={filters.doctorId}
                        onChange={(e) => setFilters(prev => ({ ...prev, doctorId: e.target.value }))}
                    >
                        <option value="all">Tất cả Bác sĩ</option>
                        {doctors.map((doc: any) => (
                            <option key={doc.id} value={doc.id}>{doc.fullName}</option>
                        ))}
                    </select>

                    <select 
                        className="flex-1 sm:flex-none bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2.5 outline-none font-medium"
                        value={filters.serviceId}
                        onChange={(e) => setFilters(prev => ({ ...prev, serviceId: e.target.value }))}
                    >
                        <option value="all">Tất cả Dịch vụ</option>
                        {services.map((svc: any) => (
                            <option key={svc.id} value={svc.id}>{svc.name}</option>
                        ))}
                    </select>
                </div>
                <button className="flex items-center justify-center gap-2 bg-slate-800 text-white px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-700 transition shadow-sm w-full lg:w-auto">
                    <Download className="w-4 h-4" /> Xuất báo cáo
                </button>
            </div>

            {/* HIỂN THỊ LỖI */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Lỗi: {error}
                </div>
            )}

            {/* HIỂN THỊ LOADING */}
            {isLoading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-slate-500 font-medium tracking-wide">Đang lấy dữ liệu từ máy chủ...</span>
                </div>
            ) : (
                <>
                    {/* 3. CÁC THẺ SỐ LIỆU TỔNG QUAN */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-r from-blue-600 to-sky-500 p-4 rounded-xl shadow-sm text-white">
                            <div className="text-blue-100 font-medium text-xs mb-1 opacity-90">Tổng Doanh Thu (Đã thu)</div>
                            <div className="text-2xl font-bold truncate tracking-tight">{formatVND(data.summary.totalRevenue)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 font-medium text-xs mb-1">Số giao dịch thanh toán</div>
                            <div className="text-2xl font-bold text-slate-800 tracking-tight">{data.summary.transactionCount}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-slate-500 font-medium text-xs mb-1">Trung bình mỗi giao dịch</div>
                            <div className="text-2xl font-bold text-slate-800 tracking-tight">{formatVND(data.summary.averagePerTransaction)}</div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                            <div className="text-rose-500 font-medium text-xs mb-1">Tổng công nợ</div>
                            <div className="text-2xl font-bold text-rose-600 tracking-tight">{formatVND(data.summary.totalDebt)}</div>
                        </div>
                    </div>

                    {/* 4. KHU VỰC BIỂU ĐỒ */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center"><BarChart3 className="w-3 h-3 text-blue-600" /></div> 
                                Biểu đồ doanh thu
                            </h3>
                            <div className="h-64 w-full">
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <LineChart data={data.revenueByDate} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={15} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${val/1000000}M`} />
                                            <Tooltip formatter={(value: any) => formatVND(value)} labelStyle={{color: '#0f172a', fontWeight: 'bold'}} />
                                            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#2563eb" strokeWidth={3.5} dot={{r: 5, fill: '#fff', strokeWidth: 2.5, stroke: '#2563eb'}} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                Tỷ trọng PT Thanh toán
                            </h3>
                            <div className="h-64 w-full mt-2">
                                {isMounted && (
                                    data.paymentMethods.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <PieChart>
                                                <Pie data={data.paymentMethods} dataKey="value" nameKey="method" cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={6}>
                                                    {data.paymentMethods.map((_, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value: any) => formatVND(value)} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '13px', color: '#475569'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-400 font-medium italic">Chưa có dữ liệu</div>
                                    )
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 lg:col-span-3">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                Top Doanh thu theo Bác sĩ
                            </h3>
                            <div className="h-64 w-full mt-2">
                                {isMounted && (
                                    data.revenueByDoctor.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                            <BarChart data={data.revenueByDoctor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(val) => `${val/1000000}M`} tick={{fill: '#94a3b8', fontSize: 12}} />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 500}} width={150} />
                                                <Tooltip formatter={(value: any) => formatVND(value)} cursor={{fill: '#f8fafc'}} />
                                                <Bar dataKey="value" name="Doanh thu" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-slate-400 font-medium italic">Chưa có dữ liệu</div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 5. BẢNG CHI TIẾT */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-5 border-b border-slate-100 bg-white">
                            <h3 className="font-bold text-slate-800 text-lg">Chi tiết giao dịch</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50/80 text-slate-500">
                                    <tr>
                                        <th className="py-4 px-6 font-semibold">Ngày thanh toán</th>
                                        <th className="py-4 px-6 font-semibold">Bệnh nhân</th>
                                        <th className="py-4 px-6 font-semibold">Dịch vụ</th>
                                        <th className="py-4 px-6 font-semibold">Bác sĩ</th>
                                        <th className="py-4 px-6 font-semibold">Hình thức</th>
                                        <th className="py-4 px-6 font-semibold text-center">Trạng thái</th>
                                        <th className="py-4 px-6 font-semibold text-right">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.recentTransactions.length > 0 ? data.recentTransactions.map((tx: any, idx: number) => (
                                        <tr key={tx.id || idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="py-4 px-6 text-slate-500">{new Date(tx.updatedAt || tx.createdAt).toLocaleDateString('vi-VN')}</td>
                                            <td className="py-4 px-6 font-semibold text-slate-800">{tx.patientName}</td>
                                            <td className="py-4 px-6 text-slate-600 truncate max-w-[200px]" title={tx.serviceName}>{tx.serviceName}</td>
                                            <td className="py-4 px-6 text-slate-600">{tx.doctorName}</td>
                                            <td className="py-4 px-6">
                                                <span className="px-3 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 rounded-lg uppercase tracking-wider">
                                                    {tx.paymentMethod || 'Tiền mặt'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {tx.status === 'Chưa thanh toán' ? (
                                                    <span className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 rounded-full">Nợ / Chưa trả</span>
                                                ) : (
                                                    <span className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">Đã thu đủ</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right font-bold text-sky-650">
                                                {formatVND(tx.finalAmount || tx.totalAmount)}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="py-12 px-6 text-center text-slate-400 font-medium italic">Không có giao dịch nào trong khoảng thời gian đã chọn.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}