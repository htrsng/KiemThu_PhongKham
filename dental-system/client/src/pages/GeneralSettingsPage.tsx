import { useEffect, useState } from 'react'
import type { AxiosError } from 'axios'
import { Building2, Clock3 } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { api } from '../lib/api'

type SettingsTab = 'clinic-info' | 'business-hours'

type SettingsRecord = {
    id: string
    settingCode: string
    value: Record<string, unknown>
}

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
    clinicName: '',
    hotline: '',
    address: '',
    email: '',
    currency: 'VND',
}

const defaultBusinessHoursForm: BusinessHoursForm = {
    weekdays: '',
    saturday: '',
    sunday: '',
}

function normalizeAxiosError(error: unknown) {
    const axiosError = error as AxiosError<{ error?: string }>
    return axiosError.response?.data?.error || axiosError.message || 'Co loi xay ra khi ket noi API.'
}

export function GeneralSettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('clinic-info')
    const [settingsRecords, setSettingsRecords] = useState<SettingsRecord[]>([])
    const [clinicInfoForm, setClinicInfoForm] = useState<ClinicInfoForm>(defaultClinicInfoForm)
    const [businessHoursForm, setBusinessHoursForm] = useState<BusinessHoursForm>(defaultBusinessHoursForm)
    const [isLoading, setIsLoading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    function findSetting(settingCode: string) {
        return settingsRecords.find((record) => record.settingCode === settingCode)
    }

    async function loadSettings() {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await api.get<{ data: SettingsRecord[] }>('/settings', { params: { limit: 200 } })
            const records = response.data.data
            setSettingsRecords(records)

            const clinic = records.find((record) => record.settingCode === 'clinic.profile')
            const hours = records.find((record) => record.settingCode === 'clinic.working-hours')

            if (clinic?.value) {
                const value = clinic.value
                setClinicInfoForm({
                    clinicName: String(value.clinicName || ''),
                    hotline: String(value.hotline || ''),
                    address: String(value.address || ''),
                    email: String(value.email || ''),
                    currency: String(value.currency || 'VND'),
                })
            }

            if (hours?.value) {
                const value = hours.value
                setBusinessHoursForm({
                    weekdays: String(value.weekdays || ''),
                    saturday: String(value.saturday || ''),
                    sunday: String(value.sunday || ''),
                })
            }
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void loadSettings()
    }, [])

    async function saveClinicInfo() {
        const record = findSetting('clinic.profile')
        if (!record) {
            setErrorMessage('Khong tim thay setting clinic.profile')
            return
        }

        setErrorMessage('')
        setSuccessMessage('')
        setIsSaving(true)

        try {
            await api.put(`/settings/${record.id}`, {
                ...record,
                value: clinicInfoForm,
            })
            setSuccessMessage('Da luu thong tin phong kham.')
            await loadSettings()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function saveBusinessHours() {
        const record = findSetting('clinic.working-hours')
        if (!record) {
            setErrorMessage('Khong tim thay setting clinic.working-hours')
            return
        }

        setErrorMessage('')
        setSuccessMessage('')
        setIsSaving(true)

        try {
            await api.put(`/settings/${record.id}`, {
                ...record,
                value: businessHoursForm,
            })
            setSuccessMessage('Da luu gio lam viec.')
            await loadSettings()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section data-testid="page-settings" className="space-y-6">
            <PageShell
                title="Cấu hình"
                description="Tab cấu hình cho thông tin phòng khám và giờ làm việc, đồng bộ dữ liệu trực tiếp với backend."
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
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'clinic-info' ? 'bg-blue-900 text-white' : 'text-slate-600'
                        }`}
                >
                    <Building2 className="h-4 w-4" />
                    Clinic Info
                </button>
                <button
                    type="button"
                    data-testid="settings-tab-business-hours"
                    onClick={() => setActiveTab('business-hours')}
                    className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${activeTab === 'business-hours' ? 'bg-blue-900 text-white' : 'text-slate-600'
                        }`}
                >
                    <Clock3 className="h-4 w-4" />
                    Business Hours
                </button>
            </div>

            {isLoading ? (
                <div data-testid="settings-loading" className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
                    Dang tai du lieu...
                </div>
            ) : null}

            {!isLoading && activeTab === 'clinic-info' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Clinic Name</span>
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
                            <span>Address</span>
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
                            <span>Currency</span>
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
                            onClick={() => {
                                void saveClinicInfo()
                            }}
                            disabled={isSaving}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60"
                        >
                            {isSaving ? 'Dang luu...' : 'Luu Clinic Info'}
                        </button>
                    </div>
                </div>
            ) : null}

            {!isLoading && activeTab === 'business-hours' ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="grid gap-4 md:grid-cols-3">
                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Weekdays</span>
                            <input
                                data-testid="settings-weekdays"
                                value={businessHoursForm.weekdays}
                                onChange={(event) => setBusinessHoursForm((prev) => ({ ...prev, weekdays: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-20:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Saturday</span>
                            <input
                                data-testid="settings-saturday"
                                value={businessHoursForm.saturday}
                                onChange={(event) => setBusinessHoursForm((prev) => ({ ...prev, saturday: event.target.value }))}
                                className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                placeholder="08:00-17:00"
                            />
                        </label>

                        <label className="space-y-2 text-sm text-slate-700">
                            <span>Sunday</span>
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
                            onClick={() => {
                                void saveBusinessHours()
                            }}
                            disabled={isSaving}
                            className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60"
                        >
                            {isSaving ? 'Dang luu...' : 'Luu Business Hours'}
                        </button>
                    </div>
                </div>
            ) : null}
        </section>
    )
}