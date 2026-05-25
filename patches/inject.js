const fs = require('fs');
const path = 'dental-system/client/src/pages/AppointmentManagementPage.tsx';

let text = fs.readFileSync(path, 'utf8');

const modalStr = `
            {/* Walk-in Modal */}
            {isWalkInModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-blue-900">Tiếp nhận Khách Vãng Lai</h3>
                            <button onClick={() => setIsWalkInModalOpen(false)} className="text-slate-400 hover:text-slate-600">X</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium">Số điện thoại * (Nhập để tìm hồ sơ cũ)</label>
                                <input type="text" value={walkInState.patientPhone} onChange={e => setWalkInState(s => ({ ...s, patientPhone: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" placeholder="VD: 0912345678" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Họ tên *</label>
                                <input type="text" value={walkInState.patientName} onChange={e => setWalkInState(s => ({ ...s, patientName: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Tuổi (nếu là bệnh nhân mới)</label>
                                <input type="number" value={walkInState.patientAge} onChange={e => setWalkInState(s => ({ ...s, patientAge: e.target.value }))} className="mt-1 w-full rounded-lg border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-rose-600">Dị ứng vật liệu (cách nhau dấu phẩy)</label>
                                <input type="text" value={walkInState.allergiesRaw} onChange={e => setWalkInState(s => ({ ...s, allergiesRaw: e.target.value }))} className="mt-1 w-full rounded-lg border-rose-300 bg-rose-50 p-2 text-sm text-rose-900" placeholder="VD: Penicillin, Thuốc tê" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Bác sĩ phụ trách *</label>
                                <select value={walkInState.doctorId} onChange={e => setWalkInState(s => ({ ...s, doctorId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn bác sĩ</option>
                                    {doctors.filter((d) => d.status === 'active').map((d) => <option key={d.id} value={d.id}>{d.fullName} ({d.specialty})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Dịch vụ sẽ khám *</label>
                                <select value={walkInState.serviceId} onChange={e => setWalkInState(s => ({ ...s, serviceId: e.target.value }))} className="mt-1 w-full rounded-lg border bg-white p-2 text-sm">
                                    <option value="">Chọn dịch vụ</option>
                                    {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between gap-3">
                            <span className="text-xs text-slate-500 italic">* Khách sẽ được tạo ca và tự Check-in ngay.</span>
                            <div className="flex gap-2">
                                <button onClick={() => setIsWalkInModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium">Hủy</button>
                                <button onClick={() => {
                                    if (walkInState.patientPhone && walkInState.patientName && walkInState.doctorId && walkInState.serviceId) {
                                        createWalkIn({
                                            ...walkInState,
                                            allergies: walkInState.allergiesRaw ? walkInState.allergiesRaw.split(',').map((s) => s.trim()).filter(Boolean) : []
                                        });
                                        setIsWalkInModalOpen(false);
                                    } else {
                                        alert('Vui lòng điền đủ SĐT, Tên, Bác sĩ, Dịch vụ!');
                                    }
                                }} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Tạo & Check-in</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
// #endregion`;

text = text.replace(/        <\/div>\n    \)\n}\n\/\/ #endregion$/, modalStr);

fs.writeFileSync(path, text, 'utf8');
console.log('Injected Modal successfully');
