import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '../components/PageShell';
import { api, type ApiListResponse } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { formatVND } from '../lib/formatters';
import { CreditCard, Printer, Search, CheckCircle, Ticket, Plus, Download } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function PaymentManagementPage() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState(location.state?.searchTerm || '');
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [discount, setDiscount] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'VND' | 'PERCENT'>('VND');
    const [paymentMethod, setPaymentMethod] = useState<string>('Tiền mặt');
    
    // Additional services (Mock)
    const [extraCharge, setExtraCharge] = useState<number>(0);
    const [extraNote, setExtraNote] = useState<string>('');

    // Fetch Invoices
    const { data: invoices = [], isLoading } = useQuery({
        queryKey: ['invoices'],
        queryFn: async () => {
            const res = await api.get<ApiListResponse<any>>('/invoices');
            return res.data.data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
    });

    const { mutate: updateInvoiceStatus } = useMutation({
        mutationFn: async ({ id, status, method, finalAmount }: { id: string, status: string, method: string, finalAmount: number }) => {
            return api.patch(`/invoices/${id}`, { status, paymentMethod: method, finalAmount });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            addToast('success', 'Thanh toán thành công!');
            setSelectedInvoice(null);
            setDiscount(0);
            setDiscountType('VND');
            setExtraCharge(0);
            setExtraNote('');
        }
    });

    const handlePayment = () => {
        if (!selectedInvoice) return;
        
        const calculatedDiscount = discountType === 'PERCENT' ? (selectedInvoice.totalAmount * discount) / 100 : discount;
        const finalCost = selectedInvoice.totalAmount + extraCharge - calculatedDiscount;
        if (finalCost < 0) {
            addToast('error', 'Giảm giá không được vượt quá tổng tiền!');
            return;
        }

        updateInvoiceStatus({ 
            id: selectedInvoice.id, 
            status: 'Đã thanh toán', 
            method: paymentMethod, 
            finalAmount: finalCost 
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadCSV = () => {
        if (!selectedInvoice) return;
        
        const calculatedDiscount = discountType === 'PERCENT' ? (selectedInvoice.totalAmount * discount) / 100 : discount;
        const finalCost = selectedInvoice.totalAmount + extraCharge - calculatedDiscount;

        const headers = ['Mã Hóa Đơn', 'Ngày', 'Khách hàng', 'Bác sĩ', 'Phương thức TT', 'Tổng tiền (VND)', 'Phụ phí (VND)', 'Khuyến mãi (VND)', 'Thành tiền (VND)', 'Trạng thái'];
        const row = [
            selectedInvoice.id,
            new Date(selectedInvoice.createdAt || new Date()).toLocaleString('vi-VN'),
            selectedInvoice.patientName,
            selectedInvoice.doctorName || 'BS Phụ Trách',
            selectedInvoice.paymentMethod || paymentMethod,
            selectedInvoice.totalAmount,
            extraCharge,
            calculatedDiscount,
            finalCost,
            selectedInvoice.status
        ];

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(',') + '\n' 
            + row.map(v => `"${v}"`).join(',');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `HoaDon_${selectedInvoice.id.substring(0,8)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredInvoices = invoices.filter(inv => 
        inv.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <PageShell><div>Đang tải dữ liệu thanh toán...</div></PageShell>;

    return (
        <PageShell>
            <div className="flex flex-col lg:flex-row gap-6 h-full print:block">
                {/* Danh sách Hóa đơn */}
                <div className="w-full lg:w-1/3 bg-white p-5 rounded-2xl border shadow-sm flex flex-col h-[calc(100vh-100px)] print:hidden">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        Danh sách hóa đơn
                    </h2>
                    
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Tìm tên KH hoặc mã HD..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                        {filteredInvoices.length === 0 && <p className="text-slate-500 italic text-center py-4">Không tìm thấy hóa đơn nào.</p>}
                        
                        {filteredInvoices.map(inv => (
                            <div 
                                key={inv.id} 
                                onClick={() => {
                                    setSelectedInvoice(inv);
                                    setDiscount(0);
                                    setDiscountType('VND');
                                    setExtraCharge(0);
                                    setExtraNote('');
                                }}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedInvoice?.id === inv.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold text-slate-800">{inv.patientName}</div>
                                    <span className={`text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-md ${inv.status === 'Đã thanh toán' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {inv.status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-500 mb-2">Mã HĐ: #{inv.id.substring(0,8).toUpperCase()}</div>
                                <div className="font-semibold text-blue-700">{formatVND(inv.totalAmount)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chi tiết Thanh Toán */}
                <div className="w-full lg:w-2/3 bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[calc(100vh-100px)] overflow-y-auto print:h-auto print:border-none print:shadow-none print:p-0">
                    {selectedInvoice ? (
                        <div className="fade-in max-w-2xl mx-auto w-full">
                            <div className="text-center mb-8 border-b border-dashed border-slate-300 pb-6 print:border-b-2 print:border-solid print:border-black">
                                <h1 className="text-3xl font-black text-blue-900 mb-2 print:text-black">NHA KHOA SMILE</h1>
                                <p className="text-slate-500 print:text-black">123 Đường Răng Sứ, Quận Smile, TP HCM</p>
                                <p className="text-slate-500 print:text-black">Hotline: 1900 9999</p>
                                
                                <h2 className="text-2xl font-bold mt-6 print:text-black">HÓA ĐƠN ĐIỀU TRỊ</h2>
                                <p className="text-sm text-slate-400">Mã HĐ: #{selectedInvoice.id.substring(0,8).toUpperCase()}</p>
                                <p className="text-sm text-slate-400">Ngày: {selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')}</p>
                            </div>

                            <div className="mb-6 grid grid-cols-2 gap-4 text-sm print:text-black">
                                <div>
                                    <p className="text-slate-500 mb-1">Khách hàng:</p>
                                    <p className="font-bold text-lg">{selectedInvoice.patientName}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-500 mb-1">Bác sĩ thực hiện:</p>
                                    <p className="font-bold text-lg">{selectedInvoice.doctorName || 'BS Phụ Trách'}</p>
                                </div>
                            </div>

                            <div className="mb-8 print:text-black">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-200 print:border-black">
                                            <th className="py-3 font-semibold text-slate-700 print:text-black">Nội dung</th>
                                            <th className="py-3 font-semibold text-slate-700 text-right print:text-black">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 print:divide-black">
                                        <tr>
                                            <td className="py-4 font-medium text-slate-800 print:text-black">Khám & Điều trị dịch vụ cơ bản</td>
                                            <td className="py-4 text-right font-medium print:text-black">{formatVND(selectedInvoice.totalAmount)}</td>
                                        </tr>
                                        {extraCharge > 0 && (
                                            <tr>
                                                <td className="py-4 font-medium text-slate-800 print:text-black">
                                                    Phụ phí / Vật liệu thêm
                                                    <div className="text-xs text-slate-500 font-normal mt-1">{extraNote}</div>
                                                </td>
                                                <td className="py-4 text-right font-medium print:text-black">{formatVND(extraCharge)}</td>
                                            </tr>
                                        )}
                                        {discount > 0 && (
                                            <tr>
                                                <td className="py-4 font-medium text-rose-600 print:text-black">
                                                    Giảm giá / Khuyến mãi {discountType === 'PERCENT' ? `(${discount}%)` : ''}
                                                </td>
                                                <td className="py-4 text-right font-medium text-rose-600 print:text-black">
                                                    -{formatVND(discountType === 'PERCENT' ? (selectedInvoice.totalAmount * discount) / 100 : discount)}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-2 border-slate-200 print:border-black text-xl font-bold bg-slate-50 print:bg-transparent">
                                            <td className="py-4 px-2 print:text-black">TỔNG CỘNG</td>
                                            <td className="py-4 px-2 text-right text-blue-700 print:text-black">
                                                {formatVND(selectedInvoice.totalAmount + extraCharge - (discountType === 'PERCENT' ? (selectedInvoice.totalAmount * discount) / 100 : discount))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {selectedInvoice.status === 'Chưa thanh toán' && (
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4 print:hidden">
                                    <h3 className="font-bold text-slate-800">Cập nhật thanh toán</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                                                <Ticket className="w-4 h-4"/> Mức giảm giá
                                            </label>
                                            <div className="flex gap-2">
                                                <select 
                                                    value={discountType} 
                                                    onChange={(e) => setDiscountType(e.target.value as 'VND' | 'PERCENT')}
                                                    className="border-slate-300 rounded-xl"
                                                >
                                                    <option value="VND">VND</option>
                                                    <option value="PERCENT">%</option>
                                                </select>
                                                <input 
                                                    type="number" 
                                                    value={discount} 
                                                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                                                    className="flex-1 border-slate-300 rounded-xl"
                                                    min="0"
                                                    max={discountType === 'PERCENT' ? 100 : undefined}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Phương thức</label>
                                            <select 
                                                value={paymentMethod} 
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full border-slate-300 rounded-xl"
                                            >
                                                <option value="Tiền mặt">Tiền mặt</option>
                                                <option value="Thẻ tín dụng">Thẻ tín dụng (POS)</option>
                                                <option value="Chuyển khoản">Chuyển khoản / VNPay</option>
                                                <option value="Ví điện tử">Ví điện tử (Momo/ZaloPay)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-2">
                                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Plus className="w-4 h-4"/> Thu thêm phụ phí (VND)</label>
                                        <div className="flex gap-2">
                                            <input 
                                                type="number" 
                                                value={extraCharge} 
                                                onChange={(e) => setExtraCharge(Number(e.target.value) || 0)}
                                                className="w-32 border-slate-300 rounded-xl"
                                                min="0"
                                                placeholder="Số tiền..."
                                            />
                                            <input 
                                                type="text" 
                                                value={extraNote} 
                                                onChange={(e) => setExtraNote(e.target.value)}
                                                className="flex-1 border-slate-300 rounded-xl"
                                                placeholder="Lý do thu thêm..."
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-slate-200">
                                        <button 
                                            onClick={handlePayment}
                                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all font-lg"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Xác Nhận Đã Thu Tiền
                                        </button>
                                    </div>
                                </div>
                            )}

                            {selectedInvoice.status === 'Đã thanh toán' && (
                                <div className="mt-8 text-center print:hidden">
                                    <div className="inline-flex items-center gap-2 text-emerald-600 bg-emerald-50 px-6 py-3 rounded-full font-bold mb-6">
                                        <CheckCircle className="w-6 h-6" /> Hóa đơn đã được thanh toán ({selectedInvoice.paymentMethod})
                                    </div>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={handlePrint}
                                            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all"
                                        >
                                            <Printer className="w-5 h-5" />
                                            In Hóa Đơn
                                        </button>
                                        <button 
                                            onClick={handleDownloadCSV}
                                            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                                        >
                                            <Download className="w-5 h-5" />
                                            Tải CSV
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 print:hidden">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <CreditCard className="w-12 h-12 text-slate-300" />
                            </div>
                            <div className="text-xl font-bold text-slate-600 mb-2">Thanh Toán & Hóa Đơn</div>
                            <p className="text-slate-500 text-center max-w-sm">Vui lòng chọn một hóa đơn từ danh sách bên trái để xem chi tiết thanh toán.</p>
                        </div>
                    )}
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    @page { margin: 0; size: A5; }
                    body * { visibility: hidden; }
                    .print\\:block, .print\\:block * { visibility: visible; }
                    .print\\:hidden { display: none !important; }
                    .print\\:block { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                }
            `}} />
        </PageShell>
    );
}