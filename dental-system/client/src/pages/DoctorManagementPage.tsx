import { useEffect, useMemo, useState } from 'react'
import { BriefcaseMedical, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { PageShell } from '../components/PageShell'
import { api } from '../lib/api'

type DoctorStatus = 'active' | 'inactive' | 'on_leave'

type DoctorRecord = {
    id: string
    fullName: string
    specialty: string
    degree?: string
    experienceYears?: number
    room?: string
    status: DoctorStatus
    consultationFee?: number
    licenseNumber?: string
}

type DoctorFormState = {
    fullName: string
    specialty: string
    degree: string
    room: string
    status: DoctorStatus
    consultationFee: string
    licenseNumber: string
}

const PAGE_SIZE = 6

const defaultFormState: DoctorFormState = {
    fullName: '',
    specialty: '',
    degree: '',
    room: '',
    status: 'active',
    consultationFee: '',
    licenseNumber: '',
}

function normalizeAxiosError(error: unknown) {
    const axiosError = error as AxiosError<{ error?: string }>
    return axiosError.response?.data?.error || axiosError.message || 'Co loi xay ra khi ket noi API.'
}

function toStatusStyle(status: DoctorStatus) {
    if (status === 'active') {
        return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    }

    if (status === 'on_leave') {
        return 'bg-amber-50 text-amber-700 ring-amber-200'
    }

    return 'bg-slate-100 text-slate-700 ring-slate-200'
}

function toStatusLabel(status: DoctorStatus) {
    if (status === 'active') return 'Hoat dong'
    if (status === 'on_leave') return 'Tam nghi'
    return 'Ngung'
}

function isValidLicenseNumber(value: string) {
    return /^[A-Z0-9-]{6,20}$/i.test(value.trim())
}

function formatCurrency(value?: number) {
    if (!value) return '0 VND'
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value)
}

export function DoctorManagementPage() {
    const [doctors, setDoctors] = useState<DoctorRecord[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [page, setPage] = useState(1)
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [licenseError, setLicenseError] = useState('')
    const [formState, setFormState] = useState<DoctorFormState>(defaultFormState)

    const filteredDoctors = useMemo(() => {
        const keyword = searchTerm.trim().toLowerCase()

        if (!keyword) {
            return doctors
        }

        return doctors.filter((doctor) => {
            return (
                doctor.fullName.toLowerCase().includes(keyword) ||
                doctor.specialty.toLowerCase().includes(keyword)
            )
        })
    }, [doctors, searchTerm])

    const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE))

    const pagedDoctors = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE
        return filteredDoctors.slice(start, start + PAGE_SIZE)
    }, [filteredDoctors, page])

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages)
        }
    }, [page, totalPages])

    async function fetchDoctors() {
        setIsLoading(true)
        setErrorMessage('')

        try {
            const response = await api.get<{ data: DoctorRecord[] }>('/doctors', {
                params: { limit: 500 },
            })
            setDoctors(response.data.data)
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void fetchDoctors()
    }, [])

    function updateForm<K extends keyof DoctorFormState>(key: K, value: DoctorFormState[K]) {
        setFormState((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    function resetModalState() {
        setEditingId(null)
        setFormState(defaultFormState)
        setLicenseError('')
        setIsModalOpen(false)
    }

    function openCreateModal() {
        setEditingId(null)
        setFormState(defaultFormState)
        setLicenseError('')
        setIsModalOpen(true)
    }

    function openEditModal(doctor: DoctorRecord) {
        setEditingId(doctor.id)
        setFormState({
            fullName: doctor.fullName,
            specialty: doctor.specialty,
            degree: doctor.degree || '',
            room: doctor.room || '',
            status: doctor.status,
            consultationFee: doctor.consultationFee ? String(doctor.consultationFee) : '',
            licenseNumber: doctor.licenseNumber || '',
        })
        setLicenseError('')
        setIsModalOpen(true)
    }

    async function saveDoctor() {
        if (!formState.fullName.trim() || !formState.specialty.trim()) {
            setErrorMessage('Vui long nhap day du Ten bac si va Chuyen khoa.')
            return
        }

        if (!isValidLicenseNumber(formState.licenseNumber)) {
            setLicenseError('So giay phep khong hop le. Dinh dang: 6-20 ky tu, chi gom chu, so, dau -')
            return
        }

        setLicenseError('')
        setIsSaving(true)
        setErrorMessage('')

        const payload = {
            fullName: formState.fullName.trim(),
            specialty: formState.specialty.trim(),
            degree: formState.degree.trim(),
            room: formState.room.trim(),
            status: formState.status,
            consultationFee: Number(formState.consultationFee) || 0,
            licenseNumber: formState.licenseNumber.trim().toUpperCase(),
        }

        try {
            if (editingId) {
                await api.put(`/doctors/${editingId}`, payload)
            } else {
                await api.post('/doctors', payload)
            }

            await fetchDoctors()
            resetModalState()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function deleteDoctor(id: string) {
        setErrorMessage('')

        try {
            await api.delete(`/doctors/${id}`)
            await fetchDoctors()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    return (
        <section data-testid="page-doctors" className="space-y-6">
            <PageShell
                title="Quản lý bác sĩ"
                description="Card grid hồ sơ bác sĩ với filter theo tên/chuyên khoa, validation license number và CRUD đầy đủ."
                testId="page-doctors"
            />

            {errorMessage ? (
                <div data-testid="doctors-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                <label className="relative block w-full md:max-w-sm" htmlFor="doctors-search-input">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        id="doctors-search-input"
                        data-testid="doctors-search-input"
                        value={searchTerm}
                        onChange={(event) => {
                            setSearchTerm(event.target.value)
                            setPage(1)
                        }}
                        placeholder="Tim theo ten bac si hoac chuyen khoa..."
                        className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                    />
                </label>

                <button
                    type="button"
                    data-testid="doctors-add-button"
                    onClick={openCreateModal}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                >
                    <Plus className="h-4 w-4" />
                    Them moi
                </button>
            </div>

            {isLoading ? (
                <div data-testid="doctors-loading" className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
                    Dang tai du lieu...
                </div>
            ) : pagedDoctors.length === 0 ? (
                <div data-testid="doctors-empty" className="rounded-3xl border border-slate-200 bg-white px-5 py-8 text-sm text-slate-500">
                    Khong co bac si phu hop bo loc.
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="doctors-card-grid">
                    {pagedDoctors.map((doctor) => (
                        <article
                            key={doctor.id}
                            data-testid={`doctor-card-${doctor.id}`}
                            className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-lg font-semibold text-slate-900">{doctor.fullName}</p>
                                    <p className="mt-1 text-sm text-slate-500">{doctor.specialty}</p>
                                </div>
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toStatusStyle(doctor.status)}`}>
                                    {toStatusLabel(doctor.status)}
                                </span>
                            </div>

                            <div className="mt-4 space-y-2 text-sm text-slate-600">
                                <p data-testid={`doctor-license-${doctor.id}`}>License: {doctor.licenseNumber || 'N/A'}</p>
                                <p>Phong: {doctor.room || 'N/A'}</p>
                                <p>Hoc ham: {doctor.degree || 'N/A'}</p>
                                <p>Phi tu van: {formatCurrency(doctor.consultationFee)}</p>
                            </div>

                            <div className="mt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    data-testid={`doctors-edit-${doctor.id}`}
                                    onClick={() => openEditModal(doctor)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-blue-900"
                                    aria-label="Sua"
                                >
                                    <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                    type="button"
                                    data-testid={`doctors-delete-${doctor.id}`}
                                    onClick={() => {
                                        void deleteDoctor(doctor.id)
                                    }}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                    aria-label="Xoa"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <span data-testid="doctors-pagination-summary">
                    Trang {page}/{totalPages} - {filteredDoctors.length} bac si
                </span>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        data-testid="doctors-pagination-prev"
                        disabled={page <= 1}
                        onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Prev
                    </button>
                    <button
                        type="button"
                        data-testid="doctors-pagination-next"
                        disabled={page >= totalPages}
                        onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
                        className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>

            {isModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" data-testid="doctors-modal-overlay">
                    <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <BriefcaseMedical className="h-5 w-5 text-blue-900" />
                                <h3 className="text-xl font-semibold text-slate-900">{editingId ? 'Sua bac si' : 'Them moi bac si'}</h3>
                            </div>
                            <button
                                type="button"
                                data-testid="doctors-modal-close"
                                onClick={resetModalState}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Full Name</span>
                                <input
                                    data-testid="doctors-form-full-name"
                                    value={formState.fullName}
                                    onChange={(event) => updateForm('fullName', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Specialty</span>
                                <input
                                    data-testid="doctors-form-specialty"
                                    value={formState.specialty}
                                    onChange={(event) => updateForm('specialty', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Degree</span>
                                <input
                                    data-testid="doctors-form-degree"
                                    value={formState.degree}
                                    onChange={(event) => updateForm('degree', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Room</span>
                                <input
                                    data-testid="doctors-form-room"
                                    value={formState.room}
                                    onChange={(event) => updateForm('room', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Status</span>
                                <select
                                    data-testid="doctors-form-status"
                                    value={formState.status}
                                    onChange={(event) => updateForm('status', event.target.value as DoctorStatus)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="active">Hoat dong</option>
                                    <option value="on_leave">Tam nghi</option>
                                    <option value="inactive">Ngung</option>
                                </select>
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Consultation Fee</span>
                                <input
                                    type="number"
                                    min={0}
                                    data-testid="doctors-form-consultation-fee"
                                    value={formState.consultationFee}
                                    onChange={(event) => updateForm('consultationFee', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>License Number</span>
                                <input
                                    data-testid="doctors-form-license-number"
                                    value={formState.licenseNumber}
                                    onChange={(event) => {
                                        updateForm('licenseNumber', event.target.value)
                                        if (licenseError) {
                                            setLicenseError('')
                                        }
                                    }}
                                    placeholder="VD: VN-123456"
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            {licenseError ? (
                                <p data-testid="doctors-license-error" className="mt-2 text-xs text-rose-600">
                                    {licenseError}
                                </p>
                            ) : null}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                data-testid="doctors-form-cancel"
                                onClick={resetModalState}
                                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                            >
                                Huy
                            </button>
                            <button
                                type="button"
                                data-testid="doctors-form-submit"
                                onClick={() => {
                                    void saveDoctor()
                                }}
                                disabled={isSaving}
                                className="h-11 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800 disabled:opacity-60"
                            >
                                {isSaving ? 'Dang luu...' : 'Luu'}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    )
}