import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '../components/PageShell';
import { api, type ApiListResponse } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Clock, CalendarIcon, CheckCircle2, Pill, Activity, Syringe, Save } from 'lucide-react';

interface DentalRecord {
    diagnosis: string;
    treatment: string;
    materials: string;
    prescription: string;
    notes: string;
}

export function DoctorExaminationPage() {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    
    // States
    const [selectedApt, setSelectedApt] = useState<any>(null);
    const [dentalRecord, setDentalRecord] = useState<DentalRecord>({
        diagnosis: '',
        treatment: '',
        materials: '',
        prescription: '',
        notes: ''
    });
    const [recallDays, setRecallDays] = useState<string>('0');

    // Fetch dependencies
    const { data: patients = [] } = useQuery({
        queryKey: ['patients'],
        queryFn: async () => {
            const res = await api.get<ApiListResponse<any>>('/patients');
            return res.data.data;
        }
    });

    const { data: services = [] } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const res = await api.get<ApiListResponse<any>>('/services');
            return res.data.data;
        }
    });

    // Fetch appointments that are in 'Đã đến' or 'Đang điều trị' state for this doctor
    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ['appointments', 'doctorQueue'],
        queryFn: async () => {
            const res = await api.get<ApiListResponse<any>>('/appointments');
            return res.data.data.filter(a => 
                (a.status === 'Đã đến' || a.status === 'Đang điều trị') &&
                (currentUser?.role === 'Admin' || a.doctorId === currentUser?.referenceId)
            );
        }
    });

    const { mutate: updateStatus } = useMutation({
        mutationFn: async ({ id, status, notes }: { id: string, status: string, notes?: string }) => {
            return api.patch(`/appointments/${id}`, { status, notes });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            addToast('success', 'Cập nhật trạng thái khám thành công!');
        }
    });

    const { mutate: createInvoice } = useMutation({
         mutationFn: async (invoiceData: any) => {
             return api.post('/invoices', invoiceData);
         },
         onSuccess: () => {
             addToast('success', 'Tạo phiếu điều trị & Thanh toán thành công!');
         }
    });

    const { mutate: createRecall } = useMutation({
        mutationFn: async (newApt: any) => {
            return api.post('/appointments', newApt);
        },
        onSuccess: () => {
            addToast('success', 'Đã tạo lịch hẹn tái khám!');
        }
   });

    const handleStartExam = (apt: any) => {
        updateStatus({ id: apt.id, status: 'Đang điều trị' });
        setSelectedApt(apt);
        // Preset form
        setDentalRecord({
            diagnosis: '',
            treatment: '',
            materials: '',
            prescription: '',
            notes: apt.notes || ''
        });
        setRecallDays('0');
    };

    const handleFinishExam = () => {
        if (!selectedApt) return;
        
        const service = services.find(s => s.id === selectedApt.serviceId);
        const amount = service ? service.basePrice : 500000;

        const combinedNotes = `
[Chẩn đoán]: ${dentalRecord.diagnosis}
[Thủ thuật]: ${dentalRecord.treatment}
[Vật liệu]: ${dentalRecord.materials}
[Đơn thuốc]: ${dentalRecord.prescription}
[Ghi chú thêm]: ${dentalRecord.notes}
        `.trim();

        // Hoàn thành khám
        updateStatus({ id: selectedApt.id, status: 'Đã hoàn thành', notes: combinedNotes });
        
        // Sinh hóa đơn tạm (Dựa trên dịch vụ đăng ký ban đầu)
        createInvoice({
            appointmentId: selectedApt.id,
            patientId: selectedApt.patientId,
            patientName: selectedApt.patientName,
            doctorId: selectedApt.doctorId,
            serviceIds: [selectedApt.serviceId],
            totalAmount: amount,
            status: 'Chưa thanh toán',
            createdAt: new Date().toISOString()
        });

        // Tạo nhắc tái khám (nếu có)
        if (recallDays !== '0') {
            const days = parseInt(recallDays);
            const recallDate = new Date();
            recallDate.setDate(recallDate.getDate() + days);
            
            const recallApt = {
                patientId: selectedApt.patientId,
                patientName: selectedApt.patientName,
                doctorId: selectedApt.doctorId,
                doctorName: selectedApt.doctorName,
                serviceId: selectedApt.serviceId, // Same service usually or checkup
                serviceName: 'Tái Khám: ' + selectedApt.serviceName,
                startTime: recallDate.toISOString(),
                endTime: new Date(recallDate.getTime() + 30 * 60000).toISOString(),
                status: 'Đã lên lịch',
                notes: 'Tự động tạo lịch tái khám.'
            };
            createRecall(recallApt);
        }

        setSelectedApt(null);
    };

    if (isLoading) return <PageShell><div>Đang tải hàng đợi...</div></PageShell>;

    return (
        <PageShell>
            <div className="flex flex-col gap-6 lg:flex-row h-full">
                {/* Hàng đợi bệnh nhân */}
                <div className="w-full lg:w-1/3 bg-white p-5 rounded-2xl border shadow-sm flex flex-col h-[calc(100vh-100px)]">
                    <h2 className="text-xl font-bold mb-4 text-blue-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" />
                        Hàng đợi hôm nay
                    </h2>
                    <div className="overflow-y-auto flex-1 space-y-3 pr-2">
                        {appointments.length === 0 && <p className="text-slate-500 italic">Không có bệnh nhân chờ khám.</p>}
                        
                        {appointments.map(apt => (
                            <div key={apt.id} className={`p-4 rounded-xl border-2 transition-all ${selectedApt?.id === apt.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-semibold text-slate-800 text-lg">{apt.patientName}</div>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-md ${apt.status === 'Đang điều trị' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'}`}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-600 mb-3 line-clamp-1">{apt.serviceName}</div>
                                
                                {apt.status === 'Đã đến' && apt.id !== selectedApt?.id && (
                                    <button onClick={() => handleStartExam(apt)} className="w-full bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 transition">
                                        Gọi vào phòng khám
                                    </button>
                                )}
                                {apt.status === 'Đang điều trị' && apt.id !== selectedApt?.id && (
                                    <button onClick={() => handleStartExam(apt)} className="w-full bg-amber-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-amber-600 transition">
                                        Tiếp tục hồ sơ
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Khu vực phòng khám */}
                <div className="w-full lg:w-2/3 bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-[calc(100vh-100px)] overflow-y-auto">
                    {selectedApt ? (() => {
                        const patient = patients.find(p => p.id === selectedApt.patientId);
                        const hasAllergy = patient?.allergies && patient.allergies.length > 0;
                        
                        return (
                        <div className="fade-in">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Phòng Khám - {selectedApt.patientName}</h2>
                                    <p className="text-slate-500 mt-1">Dịch vụ: <span className="font-medium text-slate-700">{selectedApt.serviceName}</span></p>
                                </div>
                                <button onClick={() => setSelectedApt(null)} className="text-sm font-medium text-slate-400 hover:text-slate-600 border px-3 py-1 rounded-lg">Đóng hồ sơ</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="p-5 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-blue-100">
                                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                        <Activity className="w-4 h-4 text-blue-600" />
                                        Thông tin sinh hiệu & Tiền sử
                                    </h3>
                                    {hasAllergy && (
                                        <div className="bg-rose-50 text-rose-700 p-3 rounded-xl border border-rose-200 mb-3 flex items-start gap-2">
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <div className="font-bold">CẢNH BÁO DỊ ỨNG!</div>
                                                <div className="text-sm">{patient.allergies.join(', ')}</div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2 text-sm text-slate-700">
                                        <p><span className="font-medium inline-block w-24">SĐT:</span> {patient?.phone || 'N/A'}</p>
                                        <p><span className="font-medium inline-block w-24">Ghi chú cũ:</span> {selectedApt.notes || 'Không có'}</p>
                                    </div>
                                </div>

                                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                    <h3 className="font-bold text-slate-800 mb-3">Sơ đồ răng (Dental Chart nhanh)</h3>
                                    <div className="grid grid-cols-8 gap-1.5 text-center text-xs">
                                        {/* Maxillary */}
                                        {[18,17,16,15,14,13,12,11].map((r) => <div key={r} className="border p-2 bg-slate-50 rounded-lg font-medium text-slate-600 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition">{r}</div>)}
                                        {[21,22,23,24,25,26,27,28].map((r) => <div key={r} className="border p-2 bg-slate-50 rounded-lg font-medium text-slate-600 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition">{r}</div>)}
                                        {/* Mandibular */}
                                        <div className="col-span-8 h-2"></div>
                                        {[48,47,46,45,44,43,42,41].map((r) => <div key={r} className="border p-2 bg-slate-50 rounded-lg font-medium text-slate-600 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition">{r}</div>)}
                                        {[31,32,33,34,35,36,37,38].map((r) => <div key={r} className="border p-2 bg-slate-50 rounded-lg font-medium text-slate-600 cursor-pointer hover:bg-blue-100 hover:text-blue-700 transition">{r}</div>)}
                                    </div>
                                    <div className="text-[10px] text-slate-400 mt-3 text-center uppercase tracking-wider font-semibold">* Click vào răng để ghi chú nhanh thủ thuật</div>
                                </div>
                            </div>

                            <div className="space-y-5 mb-8">
                                <h3 className="font-bold text-slate-800 text-lg border-b pb-2">Hồ Sơ Khám & Kê Đơn</h3>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chẩn đoán lâm sàng</label>
                                    <input value={dentalRecord.diagnosis} onChange={(e) => setDentalRecord({...dentalRecord, diagnosis: e.target.value})} type="text" className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="VD: Sâu răng D27, Viêm tủy D46..." />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Thủ thuật đã thực hiện</label>
                                        <textarea value={dentalRecord.treatment} onChange={(e) => setDentalRecord({...dentalRecord, treatment: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24" placeholder="VD: Trám Composite D27, Lấy tủy D46..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Syringe className="w-4 h-4 text-slate-500"/> Vật liệu sử dụng</label>
                                        <textarea value={dentalRecord.materials} onChange={(e) => setDentalRecord({...dentalRecord, materials: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24" placeholder="VD: Composite 3M, Côn Gutta Percha..." />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1"><Pill className="w-4 h-4 text-slate-500"/> Đơn thuốc & Dặn dò</label>
                                    <textarea value={dentalRecord.prescription} onChange={(e) => setDentalRecord({...dentalRecord, prescription: e.target.value})} className="w-full border-slate-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 h-24" placeholder="Nhập tên thuốc, liều lượng và lời dặn (kiêng ăn gì, chườm đá...)" />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 mb-8">
                                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-slate-500" /> Nhắc hẹn tái khám
                                </h3>
                                <div className="flex gap-4 items-center">
                                    <select value={recallDays} onChange={(e) => setRecallDays(e.target.value)} className="border-slate-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 max-w-xs">
                                        <option value="0">Không tạo nhắc hẹn</option>
                                        <option value="3">Sau 3 ngày (Tháo chỉ / Ktra)</option>
                                        <option value="7">Sau 1 tuần</option>
                                        <option value="14">Sau 2 tuần</option>
                                        <option value="30">Sau 1 tháng</option>
                                        <option value="180">Khám định kỳ 6 tháng</option>
                                    </select>
                                    {recallDays !== '0' && (
                                        <span className="text-sm font-medium text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                                            Hệ thống sẽ tự động lên ca tái khám sau {recallDays} ngày.
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button onClick={handleFinishExam} className="flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Hoàn thành & Báo Thanh Toán
                                </button>
                            </div>
                        </div>
                        );
                    })() : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="p-6 bg-slate-50 rounded-full mb-4">
                                <Save className="w-12 h-12 text-slate-300" />
                            </div>
                            <div className="text-xl font-bold text-slate-600 mb-2">Khu Vực Khám Bệnh - Cập Nhật Hồ Sơ</div>
                            <p className="text-slate-500 text-center max-w-sm">Hãy chọn một bệnh nhân từ "Hàng đợi hôm nay" ở cột bên trái để bắt đầu khám và ghi nhận hồ sơ Dental Chart.</p>
                        </div>
                    )}
                </div>
            </div>
        </PageShell>
    );
}