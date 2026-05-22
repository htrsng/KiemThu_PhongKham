import React, { useState, useEffect } from 'react'; // Tải thư viện React và các công cụ quản lý trạng thái (useState, useEffect)
import { Calendar, User, DollarSign, Award, AlertCircle, UserCheck, CheckCircle, XCircle, CalendarPlus, LogIn, Activity } from 'lucide-react'; // Tải các biểu tượng từ thư viện lucide-react
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as PieTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as BarTooltip } from 'recharts'; // Tải các công cụ vẽ biểu đồ từ thư viện recharts
import { api } from '../lib/api'; // Tải công cụ gọi API Axios 
import { formatVND } from '../lib/formatters'; // Tải công cụ định dạng tiền VND

// Khai báo component chính (Trang Tổng quan)
export function DashboardPage() {
    // 1. TẠO TRẠNG THÁI (STATE) LƯU DỮ LIỆU TỪ MÁY CHỦ
    // Khởi tạo biến data và hàm setData để cập nhật dữ liệu khi lấy được từ Server
    const [data, setData] = useState({
        // Dữ liệu cho 4 thẻ thông tin (KPIs)
        kpi: {
            appointmentsToday: 0, // Số ca đặt lịch hôm nay
            walkInsToday: 0,      // Số ca vãng lai hôm nay
            revenueToday: 0,      // Doanh thu hôm nay
            bestDoctor: {         // Thông tin bác sĩ xuất sắc nhất
                name: '',         // Tên bác sĩ
                completedCases: 0 // Số ca đã hoàn thành
            }
        },
        // Dữ liệu cho biểu đồ tiến trình (Biến động hàng đợi)
        queueCapacity: [] as { time: string, count: number }[],
        // Dữ liệu cho biểu đồ tròn (Tỷ lệ dịch vụ)
        serviceRatio: [] as { name: string, value: number }[]
    });

    // Biến trạng thái để hiển thị màn hình 'Đang tải dữ liệu...'
    const [isLoading, setIsLoading] = useState(true);
    // Biến trạng thái lưu trữ lỗi nếu mất mạng
    const [error, setError] = useState<string | null>(null);

    // 2. GỌI DỮ LIỆU TỪ MÁY CHỦ (SERVER / API) BẰNG AXIOS
    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true); // Bật trạng thái đang tải
            setError(null);     // Xóa lỗi cũ
            
            try {
                // Gọi API lấy dữ liệu dashboard thực tế từ Back-end
                const res = await api.get('/dashboard');
                // Nhận lấy gói dữ liệu (Chấp nhận dạng { data: {} } của JSON chuẩn)
                const serverData = res.data.data || res.data;

                setData(serverData);
            } catch (err) {
                console.error("Lỗi khi tải dữ liệu từ máy chủ:", err);
                setError("Quá trình kết nối với máy chủ thất bại.");
            } finally {
                setIsLoading(false); // Bắt buộc phải tắt vòng quay tải dù thành công hay lỗi
            }
        };

        // Kích hoạt chạy hàm lấy dữ liệu một lần
        fetchDashboardData();
    }, []);

    // Tạo mảng gồm 5 mã màu sắc để tô cho 5 phần tương ứng của biểu đồ tròn bánh Donut
    const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

    const iconMap: { [key: string]: React.ElementType } = {
        UserCheck,
        CheckCircle,
        XCircle,
        CalendarPlus,
        LogIn,
        Calendar,
        Activity
    };

    // 3. XUẤT GIAO DIỆN HIỂN THỊ RA MÀN HÌNH (RENDER)
    
    // Nếu có lỗi máy chủ, hiển thị ngay bảng báo đỏ
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-5 h-5" /> <span>{error}</span>
                </div>
            </div>
        );
    }

    // Rẽ nhánh: Nếu đang tải dữ liệu thì hiển thị báo hiệu tải xong rồi mới xuống code giao diện chính
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-base font-semibold text-slate-500 animate-pulse">Đang tải dữ liệu tổng quan...</div>
            </div>
        );
    }

    // Nếu đã tải dữ liệu xong và thành công, hiển thị toàn bộ nội dung sau:
    return (
        // Thẻ div bao bọc toàn bộ trang (p-6: padding lề, bg-slate-50: màu nền xám nhạt, font-sans: kiểu chữ hiện đại)
        <div className="p-6 bg-slate-50 min-h-screen w-full font-sans fade-in">
            
            {/* ---- PHẦN 1: TIÊU ĐỀ TRANG (HEADER) ---- */}
            <div className="mb-6">
                {/* Dòng chữ lớn in đậm cho tiêu đề chính */}
                <h1 className="text-2xl font-bold text-slate-800">Tổng quan tình hình phòng khám</h1>
                {/* Dòng chữ nhỏ màu nhạt giải thích phía dưới */}
                <p className="text-sm font-medium text-slate-500 mt-1">Số liệu được cập nhật dựa trên dữ liệu ngày hôm nay</p>
            </div>

            {/* ---- PHẦN 2: KHUNG THẺ THÔNG TIN (KPI CARDS) ---- */}
            {/* Lưới (grid) dùng để chia đều không gian màn hình, ngang hàng sẽ có 4 cột trên máy tính lg:grid-cols-4 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                
                {/* 1. Thẻ Lịch hẹn hôm nay */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-500 mb-1">Lịch hẹn hôm nay</div>
                        {/* Hiện biến số lượng từ json máy chủ ra */}
                        <div className="text-3xl font-extrabold text-slate-800">{data.kpi.appointmentsToday}</div>
                    </div>
                    {/* Bọc icon trong một hình tròn nền xanh nhạt */}
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                {/* 2. Thẻ Ca vãng lai mới */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-500 mb-1">Ca vãng lai mới</div>
                        <div className="text-3xl font-extrabold text-slate-800">{data.kpi.walkInsToday}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                        <User className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>

                {/* 3. Thẻ Doanh thu hôm nay */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-500 mb-1">Doanh thu hôm nay</div>
                        {/* the div hiển thị tiền: Dùng API định dạng formatVND, chọn chữ đỏ cam */}
                        <div className="text-3xl font-extrabold text-orange-500">{formatVND(data.kpi.revenueToday)}</div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                        <DollarSign className="w-6 h-6 text-orange-500" />
                    </div>
                </div>

                {/* 4. Thẻ Best Doctor (Hôm nay) */}
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <div className="text-sm font-semibold text-slate-500 mb-1">Best Doctor (Hôm nay)</div>
                        {/* Mã text màu xanh dương đậm biểu hiện tên người bsi xuất sắc nhất */}
                        <div className="text-lg font-bold text-blue-600 truncate mb-0.5">{data.kpi.bestDoctor.name}</div>
                        {/* Dòng chữ phụ nhỏ in ở dưới ghi chú */}
                        <div className="text-xs font-semibold text-slate-400 bg-slate-50 inline-block px-2 py-0.5 rounded-md border border-slate-100">
                            {data.kpi.bestDoctor.completedCases} ca hoàn thành
                        </div>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0">
                        <Award className="w-6 h-6 text-yellow-500" />
                    </div>
                </div>

            </div> {/* Kết thúc dòng 4 thẻ thông tin KPI */}

            {/* ---- PHẦN 3: KHU VỰC BIỂU ĐỒ (CHARTS KÉP TRÁI VÀ PHẢI) ---- */}
            {/* Chia lưới làm 2 biểu đồ bự */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* --- MẢNG BÊN TRÁI: BIẾN ĐỘNG HÀNG ĐỢI TRONG NGÀY --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Biến động hàng đợi trong ngày</h2>
                    <div style={{ width: '100%', height: 260 }} className="relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.queueCapacity} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <BarTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" name="Số ca" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* --- MẢNG BÊN PHẢI: TỶ LỆ DỊCH VỤ THỰC HIỆN --- */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Tỷ lệ loại dịch vụ thực hiện (Tổng quan)</h2>
                    
                    {/* Khung chứa biểu đồ tròn của Rechart - FIX LỖI HEIGHT: Fix cứng kích thước style width/height thay vì dùng class flex */}
                    <div style={{ width: '100%', height: 260 }} className="relative mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                {/* Thuộc tính innerRadius làm bánh donut rỗng ở giữa. outerRadius là vỏ ngoài */}
                                <Pie 
                                    data={data.serviceRatio} 
                                    cx="50%" // Tọa độ X giữa
                                    cy="50%" // Tọa độ Y giữa
                                    innerRadius={70} // Bán kính khoảng trống giữa tâm (giúp vẽ biểu đồ Donut rỗng giữa)
                                    outerRadius={95} // Bán kính biên ra bao ngoài
                                    paddingAngle={3} // Tạo khe hở chia tách mép từng miếng bánh
                                    dataKey="value"  // Lấy dữ liệu thuộc tính value
                                >
                                    {/* Giải lệnh quy định mâm màu từng mảnh biểu đồ */}
                                    {data.serviceRatio.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                {/* Tooltip bật hộp đen ghi chú khi dê chuột */}
                                <PieTooltip formatter={(value) => `${value}%`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Vùng phần CHÚ THÍCH (Legend) thủ công, canh thành dòng và cột rõ ràng bằng lưới (Grid) */}
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-2 px-2">
                        {data.serviceRatio.map((item, index) => (
                            <div key={index} className="flex items-center gap-2.5">
                                {/* Cục tròn bé xíu in màu biểu thị cho mảnh của nó */}
                                <div 
                                    className="w-3 h-3 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                                ></div>
                                {/* Hiệu tên loại dịch vụ - truncate giúp cắt chữ bằng 3 chấm [...] nếu chữ quá dài */}
                                <span className="text-sm font-medium text-slate-600 truncate" title={item.name}>
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div> {/* Kết thúc phần dòng biểu đồ */}

        </div>
    );
}