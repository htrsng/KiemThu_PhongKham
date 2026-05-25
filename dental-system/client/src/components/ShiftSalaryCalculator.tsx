import { useState } from 'react';
import { formatVND } from '../lib/formatters';
import { Calculator, Play, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface PatientExam {
    id: string;
    name: string;
    patientId: string;
    complexity: number;
}

export function ShiftSalaryCalculator() {
    // 1. Doctor Info
    const [doctorName, setDoctorName] = useState('Nguyễn Văn A');
    const [degreeFactor, setDegreeFactor] = useState<number>(1.3);

    // 2. Shift Info
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('11:00');
    const [shiftFactor, setShiftFactor] = useState<number>(1.0);

    // 3. Patients Info
    const [patients, setPatients] = useState<PatientExam[]>([]);
    
    // 4. Rate Info
    const [hourlyRate, setHourlyRate] = useState<number>(200000);

    // 5. Results
    const [result, setResult] = useState<any>(null);

    const calculateShiftHours = () => {
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        return (endH - startH) + (endM - startM) / 60;
    };

    const handleCalculate = () => {
        const shiftHours = calculateShiftHours();
        const totalPatientFactor = patients.reduce((sum, p) => sum + p.complexity, 0);
        const convertedHours = shiftHours * (shiftFactor + totalPatientFactor);
        const totalSalary = convertedHours * degreeFactor * hourlyRate;

        setResult({
            shiftHours,
            totalPatientFactor,
            convertedHours,
            totalSalary
        });
    };

    const addPatient = () => {
        setPatients([...patients, { id: Date.now().toString(), name: `Bệnh nhân ${patients.length + 1}`, patientId: `BN${patients.length + 1}`, complexity: 0 }]);
    };

    const removePatient = (id: string) => {
        setPatients(patients.filter(p => p.id !== id));
    };

    const updatePatient = (id: string, field: keyof PatientExam, value: any) => {
        setPatients(patients.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const runTestCase1 = () => {
        setDoctorName('BS Đại học');
        setDegreeFactor(1.3);
        setStartTime('08:00');
        setEndTime('11:00');
        setShiftFactor(1.0);
        setHourlyRate(200000);
        setPatients([
            { id: '1', name: 'BN1', patientId: 'BN001', complexity: 0 },
            { id: '2', name: 'BN2', patientId: 'BN002', complexity: 0 },
            { id: '3', name: 'BN3', patientId: 'BN003', complexity: 0 }
        ]);
        setResult(null);
    };

    const runTestCase2 = () => {
        setDoctorName('BS Giáo sư');
        setDegreeFactor(2.5);
        setStartTime('10:00');
        setEndTime('12:00');
        setShiftFactor(1.0);
        setHourlyRate(200000);
        setPatients([
            { id: '1', name: 'BN Khó 1', patientId: 'BN001', complexity: 0.5 },
            { id: '2', name: 'BN Khó 2', patientId: 'BN002', complexity: 0.5 }
        ]);
        setResult(null);
    };

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mt-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 px-4 py-1 rounded-bl-xl font-bold text-xs uppercase tracking-widest z-10">
                Bài tập thực hành
            </div>
            
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calculator className="w-5 h-5" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Máy Tính Lương Ca Trực</h2>
                    <p className="text-sm text-slate-500">Tính tiền làm thêm một ca theo độ khó bệnh nhân và bằng cấp.</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <button onClick={runTestCase1} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition">
                    <Play className="w-4 h-4 text-emerald-500" /> Test Case 1: Đại học, 3h, 3 BN thường
                </button>
                <button onClick={runTestCase2} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition">
                    <Play className="w-4 h-4 text-rose-500" /> Test Case 2: Giáo sư, 2h, 2 BN khó nhất
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* CỘT TRÁI: FORM NHẬP LIỆU */}
                <div className="space-y-6">
                    {/* Thông tin Bác sĩ */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">1. Thông tin Bác sĩ</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Họ Tên</label>
                                <input type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Bằng cấp (Hệ số)</label>
                                <select value={degreeFactor} onChange={e => setDegreeFactor(Number(e.target.value))} className="w-full text-sm border-slate-300 rounded-lg">
                                    <option value={1.3}>Đại học (1.3)</option>
                                    <option value={1.5}>Thạc sỹ (1.5)</option>
                                    <option value={1.7}>Tiến sỹ (1.7)</option>
                                    <option value={2.0}>Phó giáo sư (2.0)</option>
                                    <option value={2.5}>Giáo sư (2.5)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin Ca làm việc */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h3 className="font-bold text-slate-700 mb-3 text-sm uppercase tracking-wider">2. Thông tin Ca làm việc</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ bắt đầu</label>
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Giờ kết thúc</label>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full text-sm border-slate-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Hệ số ca</label>
                                <input type="number" step="0.1" value={shiftFactor} onChange={e => setShiftFactor(Number(e.target.value))} className="w-full text-sm border-slate-300 rounded-lg" />
                            </div>
                        </div>
                    </div>

                    {/* Danh sách Bệnh nhân */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">3. Danh sách Bệnh nhân</h3>
                            <button onClick={addPatient} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md font-bold hover:bg-blue-200 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Thêm BN
                            </button>
                        </div>
                        <div className="space-y-2">
                            {patients.length === 0 && <p className="text-xs text-slate-500 italic">Chưa có bệnh nhân nào trong ca.</p>}
                            {patients.map((p, index) => (
                                <div key={p.id} className="flex gap-2 items-center bg-white p-2 border border-slate-200 rounded-lg">
                                    <span className="text-xs font-bold text-slate-400 w-5">{index + 1}.</span>
                                    <input type="text" placeholder="Tên BN" value={p.name} onChange={e => updatePatient(p.id, 'name', e.target.value)} className="flex-1 text-sm border-slate-300 rounded-md py-1 px-2" />
                                    <select value={p.complexity} onChange={e => updatePatient(p.id, 'complexity', Number(e.target.value))} className="text-sm border-slate-300 rounded-md py-1 px-2 w-32">
                                        <option value={0}>Thường (0)</option>
                                        <option value={0.1}>Khó 1 (0.1)</option>
                                        <option value={0.2}>Khó 2 (0.2)</option>
                                        <option value={0.3}>Khó 3 (0.3)</option>
                                        <option value={0.4}>Khó 4 (0.4)</option>
                                        <option value={0.5}>Khó nhất (0.5)</option>
                                    </select>
                                    <button onClick={() => removePatient(p.id)} className="text-rose-500 p-1 hover:bg-rose-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Thông tin Tiền / giờ */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">4. Số tiền một giờ (VND)</label>
                        <input type="number" step="10000" value={hourlyRate} onChange={e => setHourlyRate(Number(e.target.value))} className="w-full text-base font-bold border-slate-300 rounded-lg text-blue-700" />
                    </div>

                    <button onClick={handleCalculate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-200 flex justify-center items-center gap-2 text-lg">
                        <Calculator className="w-5 h-5" />
                        TÍNH LƯƠNG CA TRỰC
                    </button>
                </div>

                {/* CỘT PHẢI: KẾT QUẢ */}
                <div>
                    <div className={`h-full rounded-2xl border-2 p-6 transition-all ${result ? 'border-emerald-500 bg-emerald-50/30' : 'border-dashed border-slate-300 bg-slate-50 flex items-center justify-center'}`}>
                        {!result ? (
                            <div className="text-center text-slate-400">
                                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="font-medium">Nhập dữ liệu và bấm Tính Lương<br/>để xem kết quả chi tiết.</p>
                            </div>
                        ) : (
                            <div className="fade-in space-y-6">
                                <div className="text-center border-b border-emerald-200 pb-4">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                                    <h3 className="text-emerald-800 font-bold text-xl">KẾT QUẢ TÍNH TOÁN</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Thời gian ca trực ({startTime} - {endTime}):</span>
                                        <span className="font-bold text-slate-800">{result.shiftHours.toFixed(2)} giờ</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Hệ số ca làm việc:</span>
                                        <span className="font-bold text-slate-800">{shiftFactor}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Tổng hệ số bệnh nhân ({patients.length} BN):</span>
                                        <span className="font-bold text-amber-600">+{result.totalPatientFactor.toFixed(2)}</span>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm text-sm">
                                        <div className="font-bold text-slate-700 mb-1">Công thức: Số giờ quy đổi</div>
                                        <div className="text-slate-500 mb-1">
                                            = {result.shiftHours.toFixed(2)} * ({shiftFactor} + {result.totalPatientFactor.toFixed(2)})
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Kết quả:</span>
                                            <span className="font-bold text-blue-600 text-base">{result.convertedHours.toFixed(2)} giờ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center text-sm mt-4">
                                        <span className="text-slate-600 font-medium">Hệ số bằng cấp ({doctorName}):</span>
                                        <span className="font-bold text-rose-600">x{degreeFactor}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-600 font-medium">Số tiền / giờ:</span>
                                        <span className="font-bold text-slate-800">{formatVND(hourlyRate)}</span>
                                    </div>

                                    <div className="bg-emerald-100 p-4 rounded-xl border border-emerald-300 shadow-sm mt-4">
                                        <div className="font-bold text-emerald-800 mb-2">THÀNH TIỀN LÀM THÊM CA:</div>
                                        <div className="text-xs text-emerald-700 mb-2 font-medium">
                                            = {result.convertedHours.toFixed(2)} (Giờ QĐ) * {degreeFactor} (Bằng cấp) * {formatVND(hourlyRate)}
                                        </div>
                                        <div className="text-3xl font-black text-emerald-600 text-center py-2 bg-white rounded-lg">
                                            {formatVND(result.totalSalary)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
