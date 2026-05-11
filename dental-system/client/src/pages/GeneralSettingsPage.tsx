import { useState } from 'react'
import { Building2, Clock3 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { generateMockActivities } from '../lib/mockData'

type SettingsTab = 'clinic-info' | 'business-hours'

type ClinicInfoForm = {
    clinicName: string
    hotline: string
    address: string
    email: string
    currency: string
}

type BusinessHoursForm = {
    weekdays: string
    saturday: string
    sunday: string
}

const defaultClinicInfoForm: ClinicInfoForm = {
    clinicName: 'SmileCare Dental Clinic',
    hotline: '1900 1234',
    address: '123 Đường Lê Lợi, Q.1, TP.HCM',
    email: 'contact@smilecare.vn',
    currency: 'VND',
}

const defaultBusinessHoursForm: BusinessHoursForm = {
    weekdays: '08:00-20:00',
    saturday: '08:00-17:00',
    sunday: '08:00-12:00',
}


export function GeneralSettingsPage() {
    // State
    const [activeTab, setActiveTab] = useState<SettingsTab>('clinic-info')
    const [clinicInfoForm, setClinicInfoForm] = useState<ClinicInfoForm>(defaultClinicInfoForm)
    const [businessHoursForm, setBusinessHoursForm] = useState<BusinessHoursForm>(defaultBusinessHoursForm)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Validation
    function validateClinicInfo(form: ClinicInfoForm) {
        if (!form.clinicName.trim()) return 'Tên phòng khám không được để trống.'
        if (!form.hotline.trim()) return 'Hotline không được để trống.'
        if (!form.address.trim()) return 'Địa chỉ không được để trống.'
        if (!form.email.trim() || !form.email.includes('@')) return 'Email không hợp lệ.'
        if (!form.currency.trim()) return 'Vui lòng nhập loại tiền tệ.'
        return ''
    }
    function validateBusinessHours(form: BusinessHoursForm) {
        if (!form.weekdays.trim()) return 'Vui lòng nhập giờ làm việc ngày thường.'
        if (!form.saturday.trim()) return 'Vui lòng nhập giờ làm việc thứ 7.'
        if (!form.sunday.trim()) return 'Vui lòng nhập giờ làm việc Chủ nhật.'
        return ''
    }

    function handleSaveClinicInfo() {
        const err = validateClinicInfo(clinicInfoForm)
        if (err) {
            setErrorMessage(err)
            setSuccessMessage('')
            return
        }
        setSuccessMessage('Đã lưu thông tin phòng khám (mock).')
        setErrorMessage('')
    }
    function handleSaveBusinessHours() {
        const err = validateBusinessHours(businessHoursForm)
        if (err) {
            setErrorMessage(err)
            setSuccessMessage('')
            return
        }
        setSuccessMessage('Đã lưu giờ làm việc (mock).')
        setErrorMessage('')
    }

    // Recent activity (mock)
    const recentActivities = generateMockActivities(5)

    return (
        <section data-testid="page-settings" className="space-y-6">
            <PageShell
                title="Cấu hình"
                description="Tab cấu hình cho thông tin phòng khám và giờ làm việc. Dữ liệu chỉ lưu tạm thời (mock)."
                testId="page-settings"
            />

            {errorMessage ? (
                <div data-testid="settings-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            {successMessage ? (
                <div data-testid="settings-success" className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                    {successMessage}
                </div>
            ) : null}

            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" data-testid="settings-tab-list">
                <button
                    type="button"
                    data-testid="settings-tab-clinic-info"
                    onClick={() => setActiveTab('clinic-info')}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'clinic-info' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                >
                    <Building2 className="h-4 w-4" />
                    Clinic Info
                </button>
                <button
                    type="button"
                    data-testid="settings-tab-business-hours"
                    onClick={() => setActiveTab('business-hours')}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'business-hours' ? 'bg-blue-900 text-white' : 'text-slate-600'}`}
                >
                    <Clock3 className="h-4 w-4" />
                    Business Hours
                </button>
            </div>

            {activeTab === 'clinic-info' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Tên phòng khám</span>
                            <input
                                data-testid="settings-clinic-name"
                                value={clinicInfoForm.clinicName}
                                onChange={(event) => setClinicInfoForm((prev) => ({ ...prev, clinicName: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Hotline</span>
                            <input
                                data-testid="settings-hotline"
                                value={clinicInfoForm.hotline}
                                onChange={(event) => setClinicInfoForm((prev) => ({ ...prev, hotline: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700 md:col-span-2">
                            <span>Địa chỉ</span>
                            <input
                                data-testid="settings-address"
                                value={clinicInfoForm.address}
                                onChange={(event) => setClinicInfoForm((prev) => ({ ...prev, address: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Email</span>
                            <input
                                data-testid="settings-email"
                                value={clinicInfoForm.email}
                                onChange={(event) => setClinicInfoForm((prev) => ({ ...prev, email: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Tiền tệ</span>
                            <input
                                data-testid="settings-currency"
                                value={clinicInfoForm.currency}
                                onChange={(event) => setClinicInfoForm((prev) => ({ ...prev, currency: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            data-testid="settings-save-clinic-info"
                            onClick={handleSaveClinicInfo}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            Lưu thông tin
                        </button>
                    </div>
                </div>
            ) : null}

            {activeTab === 'business-hours' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Ngày thường</span>
                            <input
                                data-testid="settings-weekdays"
                                value={businessHoursForm.weekdays}
                                onChange={(event) => setBusinessHoursForm((prev) => ({ ...prev, weekdays: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-20:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Thứ 7</span>
                            <input
                                data-testid="settings-saturday"
                                value={businessHoursForm.saturday}
                                onChange={(event) => setBusinessHoursForm((prev) => ({ ...prev, saturday: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-17:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Chủ nhật</span>
                            <input
                                data-testid="settings-sunday"
                                value={businessHoursForm.sunday}
                                onChange={(event) => setBusinessHoursForm((prev) => ({ ...prev, sunday: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-12:00"
                            />
                        </label>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            data-testid="settings-save-business-hours"
                            onClick={handleSaveBusinessHours}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            Lưu giờ làm việc
                        </button>
                    </div>
                </div>
            ) : null}

            <div className="mt-10">
                <h3 className="mb-3 text-lg font-semibold text-slate-800">Hoạt động gần đây</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-[400px] w-full text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Thời gian</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Loại</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Mô tả</th>
                                <th className="px-4 py-2 text-left font-semibold text-slate-700">Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentActivities.map((act) => (
                                <tr key={act.id}>
                                    <td className="px-4 py-2 whitespace-nowrap">{new Date(act.timestamp).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{act.type}</td>
                                    <td className="px-4 py-2">{act.description}</td>
                                    <td className="px-4 py-2 whitespace-nowrap">{act.performer}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
