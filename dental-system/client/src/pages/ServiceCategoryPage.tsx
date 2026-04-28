import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { AxiosError } from 'axios'
import { PageShell } from '../components/PageShell'
import { api } from '../lib/api'

type PageTab = 'service-master' | 'pricing-policy'
type PatientType = 'regular' | 'student' | 'child' | 'senior'

type ServiceRecord = {
    id: string
    name: string
    unit?: string
    status?: string
}

type AgeDiscountRule = {
    minAge: number
    maxAge: number
    discountPercent: number
    label?: string
}

type SeasonalPromotion = {
    label?: string
    discountPercent: number
    startsOn: string
    endsOn: string
}

type PricingPolicyRecord = {
    id: string
    serviceName: string
    serviceId?: string
    basePrice: number
    studentDiscountPercent?: number
    ageDiscountRules?: AgeDiscountRule[]
    seasonalPromotions?: SeasonalPromotion[]
    status?: string
}

type ServiceFormState = {
    name: string
    unit: string
    status: string
}

type PricingFormState = {
    serviceId: string
    serviceName: string
    basePrice: string
    enableStudentDiscount: boolean
    studentDiscountPercent: string
    enableAgeDiscount: boolean
    ageMin: string
    ageMax: string
    ageDiscountPercent: string
    enableSeasonalPromotion: boolean
    promotionStartDate: string
    promotionEndDate: string
    promotionDiscountPercent: string
}

const PAGE_SIZE = 8
const todayISO = new Date().toISOString().split('T')[0]

const defaultServiceFormState: ServiceFormState = {
    name: '',
    unit: '',
    status: 'active',
}

const defaultPricingFormState: PricingFormState = {
    serviceId: '',
    serviceName: '',
    basePrice: '',
    enableStudentDiscount: false,
    studentDiscountPercent: '',
    enableAgeDiscount: false,
    ageMin: '',
    ageMax: '',
    ageDiscountPercent: '',
    enableSeasonalPromotion: false,
    promotionStartDate: todayISO,
    promotionEndDate: todayISO,
    promotionDiscountPercent: '',
}

function normalizeAxiosError(error: unknown) {
    const axiosError = error as AxiosError<{ error?: string }>
    return axiosError.response?.data?.error || axiosError.message || 'Co loi xay ra khi ket noi API.'
}

function toCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    }).format(value)
}

function calculateCurrentPrice(policy: PricingPolicyRecord, patientType: PatientType, currentDateISO: string) {
    const discounts: number[] = []
    const date = new Date(currentDateISO)

    if (patientType === 'student' && policy.studentDiscountPercent) {
        discounts.push(policy.studentDiscountPercent)
    }

    const ageValue = patientType === 'child' ? 10 : patientType === 'senior' ? 65 : 30
    const ageRule = policy.ageDiscountRules?.[0]

    if (ageRule && ageValue >= ageRule.minAge && ageValue <= ageRule.maxAge) {
        discounts.push(ageRule.discountPercent)
    }

    const promoRule = policy.seasonalPromotions?.[0]
    if (promoRule?.startsOn && promoRule?.endsOn) {
        const startDate = new Date(promoRule.startsOn)
        const endDate = new Date(promoRule.endsOn)
        if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && date >= startDate && date <= endDate) {
            discounts.push(promoRule.discountPercent)
        }
    }

    const totalDiscountPercent = discounts.reduce((sum, value) => sum + value, 0)
    const currentPrice = Math.max(0, Math.round(policy.basePrice * (1 - totalDiscountPercent / 100)))

    return {
        currentPrice,
        totalDiscountPercent,
    }
}

export function ServiceCategoryPage() {
    const [activeTab, setActiveTab] = useState<PageTab>('service-master')
    const [services, setServices] = useState<ServiceRecord[]>([])
    const [pricingPolicies, setPricingPolicies] = useState<PricingPolicyRecord[]>([])

    const [serviceSearchTerm, setServiceSearchTerm] = useState('')
    const [pricingSearchTerm, setPricingSearchTerm] = useState('')

    const [servicePage, setServicePage] = useState(1)
    const [pricingPage, setPricingPage] = useState(1)

    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
    const [serviceEditingId, setServiceEditingId] = useState<string | null>(null)
    const [serviceFormState, setServiceFormState] = useState<ServiceFormState>(defaultServiceFormState)

    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
    const [pricingEditingId, setPricingEditingId] = useState<string | null>(null)
    const [pricingFormState, setPricingFormState] = useState<PricingFormState>(defaultPricingFormState)

    const [isSaving, setIsSaving] = useState(false)

    const [patientType, setPatientType] = useState<PatientType>('regular')
    const [currentDate, setCurrentDate] = useState(todayISO)

    const filteredServices = useMemo(() => {
        const keyword = serviceSearchTerm.trim().toLowerCase()
        if (!keyword) return services
        return services.filter((service) => service.name.toLowerCase().includes(keyword) || (service.unit || '').toLowerCase().includes(keyword))
    }, [serviceSearchTerm, services])

    const filteredPolicies = useMemo(() => {
        const keyword = pricingSearchTerm.trim().toLowerCase()
        if (!keyword) return pricingPolicies
        return pricingPolicies.filter((policy) => policy.serviceName.toLowerCase().includes(keyword))
    }, [pricingPolicies, pricingSearchTerm])

    const serviceTotalPages = Math.max(1, Math.ceil(filteredServices.length / PAGE_SIZE))
    const pricingTotalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE))

    const pagedServices = useMemo(() => {
        const start = (servicePage - 1) * PAGE_SIZE
        return filteredServices.slice(start, start + PAGE_SIZE)
    }, [filteredServices, servicePage])

    const pagedPolicies = useMemo(() => {
        const start = (pricingPage - 1) * PAGE_SIZE
        return filteredPolicies.slice(start, start + PAGE_SIZE)
    }, [filteredPolicies, pricingPage])

    useEffect(() => {
        if (servicePage > serviceTotalPages) {
            setServicePage(serviceTotalPages)
        }
    }, [servicePage, serviceTotalPages])

    useEffect(() => {
        if (pricingPage > pricingTotalPages) {
            setPricingPage(pricingTotalPages)
        }
    }, [pricingPage, pricingTotalPages])

    async function fetchServices() {
        const response = await api.get<{ data: ServiceRecord[] }>('/services', { params: { limit: 500 } })
        setServices(response.data.data)
    }

    async function fetchPricingPolicies() {
        const response = await api.get<{ data: PricingPolicyRecord[] }>('/pricing-policies', { params: { limit: 500 } })
        setPricingPolicies(response.data.data)
    }

    async function reloadData() {
        setIsLoading(true)
        setErrorMessage('')
        try {
            await Promise.all([fetchServices(), fetchPricingPolicies()])
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        void reloadData()
    }, [])

    function updateServiceForm<K extends keyof ServiceFormState>(key: K, value: ServiceFormState[K]) {
        setServiceFormState((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    function updatePricingForm<K extends keyof PricingFormState>(key: K, value: PricingFormState[K]) {
        setPricingFormState((previous) => ({
            ...previous,
            [key]: value,
        }))
    }

    function resetServiceModalState() {
        setServiceEditingId(null)
        setServiceFormState(defaultServiceFormState)
        setIsServiceModalOpen(false)
    }

    function resetPricingModalState() {
        setPricingEditingId(null)
        setPricingFormState(defaultPricingFormState)
        setIsPricingModalOpen(false)
    }

    function openCreateServiceModal() {
        setServiceEditingId(null)
        setServiceFormState(defaultServiceFormState)
        setIsServiceModalOpen(true)
    }

    function openEditServiceModal(service: ServiceRecord) {
        setServiceEditingId(service.id)
        setServiceFormState({
            name: service.name,
            unit: service.unit || '',
            status: service.status || 'active',
        })
        setIsServiceModalOpen(true)
    }

    function openCreatePricingModal() {
        setPricingEditingId(null)
        setPricingFormState(defaultPricingFormState)
        setIsPricingModalOpen(true)
    }

    function openEditPricingModal(policy: PricingPolicyRecord) {
        const firstAgeRule = policy.ageDiscountRules?.[0]
        const firstPromo = policy.seasonalPromotions?.[0]

        setPricingEditingId(policy.id)
        setPricingFormState({
            serviceId: policy.serviceId || '',
            serviceName: policy.serviceName,
            basePrice: String(policy.basePrice),
            enableStudentDiscount: Boolean(policy.studentDiscountPercent),
            studentDiscountPercent: policy.studentDiscountPercent ? String(policy.studentDiscountPercent) : '',
            enableAgeDiscount: Boolean(firstAgeRule),
            ageMin: firstAgeRule ? String(firstAgeRule.minAge) : '',
            ageMax: firstAgeRule ? String(firstAgeRule.maxAge) : '',
            ageDiscountPercent: firstAgeRule ? String(firstAgeRule.discountPercent) : '',
            enableSeasonalPromotion: Boolean(firstPromo),
            promotionStartDate: firstPromo?.startsOn || todayISO,
            promotionEndDate: firstPromo?.endsOn || todayISO,
            promotionDiscountPercent: firstPromo ? String(firstPromo.discountPercent) : '',
        })
        setIsPricingModalOpen(true)
    }

    async function saveService() {
        if (!serviceFormState.name.trim() || !serviceFormState.unit.trim()) {
            setErrorMessage('Service Name va Unit la bat buoc.')
            return
        }

        setIsSaving(true)
        setErrorMessage('')

        const payload = {
            name: serviceFormState.name.trim(),
            unit: serviceFormState.unit.trim(),
            status: serviceFormState.status,
        }

        try {
            if (serviceEditingId) {
                await api.put(`/services/${serviceEditingId}`, payload)
            } else {
                await api.post('/services', payload)
            }
            await reloadData()
            resetServiceModalState()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function deleteService(id: string) {
        setErrorMessage('')
        try {
            await api.delete(`/services/${id}`)
            await reloadData()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    async function savePricingPolicy() {
        const basePrice = Number(pricingFormState.basePrice)

        if (!pricingFormState.serviceName.trim() || Number.isNaN(basePrice) || basePrice <= 0) {
            setErrorMessage('Service va Gia goc phai hop le.')
            return
        }

        const ageRules: AgeDiscountRule[] = pricingFormState.enableAgeDiscount
            ? [
                  {
                      minAge: Number(pricingFormState.ageMin) || 0,
                      maxAge: Number(pricingFormState.ageMax) || 0,
                      discountPercent: Number(pricingFormState.ageDiscountPercent) || 0,
                      label: 'Age rule',
                  },
              ]
            : []

        const seasonalPromotions: SeasonalPromotion[] = pricingFormState.enableSeasonalPromotion
            ? [
                  {
                      label: 'Promo',
                      discountPercent: Number(pricingFormState.promotionDiscountPercent) || 0,
                      startsOn: pricingFormState.promotionStartDate,
                      endsOn: pricingFormState.promotionEndDate,
                  },
              ]
            : []

        const payload = {
            serviceId: pricingFormState.serviceId,
            serviceName: pricingFormState.serviceName.trim(),
            basePrice,
            studentDiscountPercent: pricingFormState.enableStudentDiscount
                ? Number(pricingFormState.studentDiscountPercent) || 0
                : 0,
            ageDiscountRules: ageRules,
            seasonalPromotions,
            status: 'active',
        }

        setIsSaving(true)
        setErrorMessage('')

        try {
            if (pricingEditingId) {
                await api.put(`/pricing-policies/${pricingEditingId}`, payload)
            } else {
                await api.post('/pricing-policies', payload)
            }
            await reloadData()
            resetPricingModalState()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        } finally {
            setIsSaving(false)
        }
    }

    async function deletePricingPolicy(id: string) {
        setErrorMessage('')
        try {
            await api.delete(`/pricing-policies/${id}`)
            await reloadData()
        } catch (error) {
            setErrorMessage(normalizeAxiosError(error))
        }
    }

    return (
        <section data-testid="page-pricing-policy" className="space-y-6">
            <PageShell
                title="Dich vu va chinh sach gia"
                description="Service Master CRUD va Pricing Policy theo business rule gia hien hanh."
                testId="page-pricing-policy"
            />

            {errorMessage ? (
                <div data-testid="services-error" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {errorMessage}
                </div>
            ) : null}

            <div className="inline-flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm" data-testid="services-tab-list">
                <button
                    type="button"
                    data-testid="services-tab-master"
                    onClick={() => setActiveTab('service-master')}
                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${
                        activeTab === 'service-master' ? 'bg-blue-900 text-white' : 'text-slate-600'
                    }`}
                >
                    Service Master
                </button>
                <button
                    type="button"
                    data-testid="services-tab-pricing"
                    onClick={() => setActiveTab('pricing-policy')}
                    className={`h-10 rounded-xl px-4 text-sm font-semibold transition ${
                        activeTab === 'pricing-policy' ? 'bg-blue-900 text-white' : 'text-slate-600'
                    }`}
                >
                    Pricing Policy
                </button>
            </div>

            {activeTab === 'service-master' ? (
                <>
                    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <label className="relative block w-full md:max-w-sm" htmlFor="service-master-search-input">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                id="service-master-search-input"
                                data-testid="service-master-search-input"
                                value={serviceSearchTerm}
                                onChange={(event) => {
                                    setServiceSearchTerm(event.target.value)
                                    setServicePage(1)
                                }}
                                placeholder="Tim Service Name hoac Unit..."
                                className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <button
                            type="button"
                            data-testid="service-master-add-button"
                            onClick={openCreateServiceModal}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Them moi
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Service Name</th>
                                    <th className="px-5 py-4">Unit</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td className="px-5 py-8 text-sm text-slate-500" colSpan={4} data-testid="service-master-loading">
                                            Dang tai du lieu...
                                        </td>
                                    </tr>
                                ) : pagedServices.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-8 text-sm text-slate-500" colSpan={4} data-testid="service-master-empty">
                                            Khong co du lieu.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedServices.map((service) => (
                                        <tr key={service.id} className="border-b border-slate-100 last:border-b-0" data-testid={`service-master-row-${service.id}`}>
                                            <td className="px-5 py-4 text-sm font-medium text-slate-900">{service.name}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700">{service.unit || 'N/A'}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700">{service.status || 'active'}</td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        data-testid={`service-master-edit-${service.id}`}
                                                        onClick={() => openEditServiceModal(service)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-blue-900"
                                                        aria-label="Sua"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        data-testid={`service-master-delete-${service.id}`}
                                                        onClick={() => {
                                                            void deleteService(service.id)
                                                        }}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                        aria-label="Xoa"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                        <span data-testid="service-master-pagination-summary">
                            Trang {servicePage}/{serviceTotalPages} - {filteredServices.length} ban ghi
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                data-testid="service-master-pagination-prev"
                                disabled={servicePage <= 1}
                                onClick={() => setServicePage((previous) => Math.max(1, previous - 1))}
                                className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                data-testid="service-master-pagination-next"
                                disabled={servicePage >= serviceTotalPages}
                                onClick={() => setServicePage((previous) => Math.min(serviceTotalPages, previous + 1))}
                                className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <label className="relative block w-full md:max-w-sm" htmlFor="pricing-policy-search-input">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    id="pricing-policy-search-input"
                                    data-testid="pricing-policy-search-input"
                                    value={pricingSearchTerm}
                                    onChange={(event) => {
                                        setPricingSearchTerm(event.target.value)
                                        setPricingPage(1)
                                    }}
                                    placeholder="Tim theo ten dich vu..."
                                    className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>

                            <select
                                data-testid="select-patient-type"
                                value={patientType}
                                onChange={(event) => setPatientType(event.target.value as PatientType)}
                                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            >
                                <option value="regular">Regular</option>
                                <option value="student">Student</option>
                                <option value="child">Child</option>
                                <option value="senior">Senior</option>
                            </select>

                            <input
                                data-testid="input-current-date"
                                type="date"
                                value={currentDate}
                                onChange={(event) => setCurrentDate(event.target.value)}
                                className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            />
                        </div>

                        <button
                            type="button"
                            data-testid="btn-open-create-policy-modal"
                            onClick={openCreatePricingModal}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Them moi
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
                        <table className="min-w-full text-left">
                            <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-[0.16em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Service</th>
                                    <th className="px-5 py-4">Gia goc</th>
                                    <th className="px-5 py-4">Gia hien hanh</th>
                                    <th className="px-5 py-4">Rule summary</th>
                                    <th className="px-5 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="pricing-policy-loading">
                                            Dang tai du lieu...
                                        </td>
                                    </tr>
                                ) : pagedPolicies.length === 0 ? (
                                    <tr>
                                        <td className="px-5 py-8 text-sm text-slate-500" colSpan={5} data-testid="pricing-policy-empty">
                                            Khong co du lieu.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedPolicies.map((policy) => {
                                        const pricing = calculateCurrentPrice(policy, patientType, currentDate)
                                        const ageRule = policy.ageDiscountRules?.[0]
                                        const promoRule = policy.seasonalPromotions?.[0]

                                        return (
                                            <tr key={policy.id} className="border-b border-slate-100 last:border-b-0" data-testid={`pricing-policy-row-${policy.id}`}>
                                                <td className="px-5 py-4 text-sm font-medium text-slate-900">{policy.serviceName}</td>
                                                <td className="px-5 py-4 text-sm text-slate-700">{toCurrency(policy.basePrice)}</td>
                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-semibold text-blue-900">{toCurrency(pricing.currentPrice)}</p>
                                                    <p className="text-xs text-slate-500">Discount {pricing.totalDiscountPercent}%</p>
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-600">
                                                    <p>Student: {policy.studentDiscountPercent || 0}%</p>
                                                    <p>
                                                        Age:{' '}
                                                        {ageRule
                                                            ? `${ageRule.minAge}-${ageRule.maxAge} (${ageRule.discountPercent}%)`
                                                            : 'N/A'}
                                                    </p>
                                                    <p>
                                                        Promo:{' '}
                                                        {promoRule
                                                            ? `${promoRule.startsOn} -> ${promoRule.endsOn} (${promoRule.discountPercent}%)`
                                                            : 'N/A'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            data-testid={`pricing-policy-edit-${policy.id}`}
                                                            onClick={() => openEditPricingModal(policy)}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-blue-900"
                                                            aria-label="Sua"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            data-testid={`pricing-policy-delete-${policy.id}`}
                                                            onClick={() => {
                                                                void deletePricingPolicy(policy.id)
                                                            }}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                            aria-label="Xoa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                        <span data-testid="pricing-policy-pagination-summary">
                            Trang {pricingPage}/{pricingTotalPages} - {filteredPolicies.length} ban ghi
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                data-testid="pricing-policy-pagination-prev"
                                disabled={pricingPage <= 1}
                                onClick={() => setPricingPage((previous) => Math.max(1, previous - 1))}
                                className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                data-testid="pricing-policy-pagination-next"
                                disabled={pricingPage >= pricingTotalPages}
                                onClick={() => setPricingPage((previous) => Math.min(pricingTotalPages, previous + 1))}
                                className="h-9 rounded-xl border border-slate-200 px-3 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}

            {isServiceModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" data-testid="service-master-modal-overlay">
                    <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-slate-900">{serviceEditingId ? 'Sua service' : 'Them moi service'}</h3>
                            <button
                                type="button"
                                data-testid="service-master-modal-close"
                                onClick={resetServiceModalState}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 space-y-4">
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Service Name</span>
                                <input
                                    data-testid="service-master-form-name"
                                    value={serviceFormState.name}
                                    onChange={(event) => updateServiceForm('name', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Unit</span>
                                <input
                                    data-testid="service-master-form-unit"
                                    value={serviceFormState.unit}
                                    onChange={(event) => updateServiceForm('unit', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                            <label className="space-y-2 text-sm text-slate-700">
                                <span>Status</span>
                                <select
                                    data-testid="service-master-form-status"
                                    value={serviceFormState.status}
                                    onChange={(event) => updateServiceForm('status', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                </select>
                            </label>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                data-testid="service-master-form-cancel"
                                onClick={resetServiceModalState}
                                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                            >
                                Huy
                            </button>
                            <button
                                type="button"
                                data-testid="service-master-form-submit"
                                onClick={() => {
                                    void saveService()
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

            {isPricingModalOpen ? (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4" data-testid="modal-create-policy-overlay">
                    <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {pricingEditingId ? 'Sua Pricing Policy' : 'Them moi Pricing Policy'}
                            </h3>
                            <button
                                type="button"
                                data-testid="btn-close-create-policy-modal"
                                onClick={resetPricingModalState}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="service-select">
                                    Select Service
                                </label>
                                <select
                                    id="service-select"
                                    data-testid="select-service"
                                    value={pricingFormState.serviceId}
                                    onChange={(event) => {
                                        const selectedId = event.target.value
                                        const selectedService = services.find((service) => service.id === selectedId)
                                        updatePricingForm('serviceId', selectedId)
                                        updatePricingForm('serviceName', selectedService?.name || '')
                                    }}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                >
                                    <option value="">Chon dich vu...</option>
                                    {services.map((service) => (
                                        <option key={service.id} value={service.id}>
                                            {service.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700" htmlFor="base-price-input">
                                    Base Price
                                </label>
                                <input
                                    id="base-price-input"
                                    data-testid="input-base-price"
                                    type="number"
                                    min={0}
                                    value={pricingFormState.basePrice}
                                    onChange={(event) => updatePricingForm('basePrice', event.target.value)}
                                    className="h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                                <p className="text-xs text-slate-500" data-testid="text-base-price-format">
                                    {pricingFormState.basePrice ? toCurrency(Number(pricingFormState.basePrice)) : '0 VND'}
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
                            <h4 className="text-sm font-semibold text-slate-900">Dynamic Rules</h4>

                            <div className="mt-4 space-y-4">
                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <input
                                            data-testid="check-student-discount"
                                            type="checkbox"
                                            checked={pricingFormState.enableStudentDiscount}
                                            onChange={(event) => updatePricingForm('enableStudentDiscount', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-900"
                                        />
                                        Enable Student Discount
                                    </label>

                                    {pricingFormState.enableStudentDiscount ? (
                                        <div className="grid gap-2 md:max-w-xs">
                                            <label className="text-xs text-slate-600" htmlFor="student-discount-percent">
                                                Discount (%)
                                            </label>
                                            <input
                                                id="student-discount-percent"
                                                data-testid="input-student-discount-percent"
                                                type="number"
                                                min={0}
                                                max={100}
                                                value={pricingFormState.studentDiscountPercent}
                                                onChange={(event) => updatePricingForm('studentDiscountPercent', event.target.value)}
                                                className="h-10 rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                            />
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <input
                                            data-testid="check-age-discount"
                                            type="checkbox"
                                            checked={pricingFormState.enableAgeDiscount}
                                            onChange={(event) => updatePricingForm('enableAgeDiscount', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-900"
                                        />
                                        Enable Senior/Child Discount
                                    </label>

                                    {pricingFormState.enableAgeDiscount ? (
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="age-min-input">
                                                    Min age
                                                </label>
                                                <input
                                                    id="age-min-input"
                                                    data-testid="input-age-min"
                                                    type="number"
                                                    min={0}
                                                    value={pricingFormState.ageMin}
                                                    onChange={(event) => updatePricingForm('ageMin', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="age-max-input">
                                                    Max age
                                                </label>
                                                <input
                                                    id="age-max-input"
                                                    data-testid="input-age-max"
                                                    type="number"
                                                    min={0}
                                                    value={pricingFormState.ageMax}
                                                    onChange={(event) => updatePricingForm('ageMax', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="age-discount-percent-input">
                                                    Discount (%)
                                                </label>
                                                <input
                                                    id="age-discount-percent-input"
                                                    data-testid="input-age-discount-percent"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={pricingFormState.ageDiscountPercent}
                                                    onChange={(event) => updatePricingForm('ageDiscountPercent', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>

                                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
                                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <input
                                            data-testid="check-seasonal-promotion"
                                            type="checkbox"
                                            checked={pricingFormState.enableSeasonalPromotion}
                                            onChange={(event) => updatePricingForm('enableSeasonalPromotion', event.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-900"
                                        />
                                        Seasonal Promotion
                                    </label>

                                    {pricingFormState.enableSeasonalPromotion ? (
                                        <div className="grid gap-3 md:grid-cols-3">
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="promotion-start-date">
                                                    Start Date
                                                </label>
                                                <input
                                                    id="promotion-start-date"
                                                    data-testid="input-promotion-start-date"
                                                    type="date"
                                                    value={pricingFormState.promotionStartDate}
                                                    onChange={(event) => updatePricingForm('promotionStartDate', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="promotion-end-date">
                                                    End Date
                                                </label>
                                                <input
                                                    id="promotion-end-date"
                                                    data-testid="input-promotion-end-date"
                                                    type="date"
                                                    value={pricingFormState.promotionEndDate}
                                                    onChange={(event) => updatePricingForm('promotionEndDate', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs text-slate-600" htmlFor="promotion-discount-percent-input">
                                                    Discount (%)
                                                </label>
                                                <input
                                                    id="promotion-discount-percent-input"
                                                    data-testid="input-promotion-discount-percent"
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    value={pricingFormState.promotionDiscountPercent}
                                                    onChange={(event) => updatePricingForm('promotionDiscountPercent', event.target.value)}
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm"
                                                />
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                data-testid="btn-cancel-create-policy"
                                onClick={resetPricingModalState}
                                className="h-11 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-600"
                            >
                                Huy
                            </button>
                            <button
                                type="button"
                                data-testid="btn-save-policy"
                                onClick={() => {
                                    void savePricingPolicy()
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
