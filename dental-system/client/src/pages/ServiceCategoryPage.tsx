import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { PageShell } from '../components/PageShell'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'
import { formatVND, formatDate } from '../lib/formatters'
import { generateMockServices, generateMockPricingPolicies, type MockService, type MockPricingPolicy } from '../lib/mockData'
import { EmptyState } from '../components/EmptyState'

type Tab = 'services' | 'pricing'

const CATEGORIES = ['Khám', 'Điều trị', 'Phẫu thuật', 'Thẩm mỹ', 'Vệ sinh']
const UNITS = ['răng', 'hàm', 'lần', 'liệu trình']

type ServiceFormState = {
    name: string
    code: string
    category: MockService['category']
    unit: MockService['unit']
    duration: number
    description: string
    basePrice: number
    status: 'active' | 'inactive'
}

type ServiceFormErrors = Partial<Record<keyof ServiceFormState, string>>

type PricingFormState = {
    serviceId: string
    type: 'Niêm yết' | 'Bảo hiểm' | 'Ưu đãi' | 'VIP'
    price: number
    effectiveDate: string
    expiryDate: string
    status: 'active' | 'inactive'
}

type PricingFormErrors = Partial<Record<keyof PricingFormState, string>>

export function ServiceCategoryPage() {
    const [activeTab, setActiveTab] = useState<Tab>('services')
    const [services, setServices] = useState<MockService[]>([])
    const [pricingPolicies, setPricingPolicies] = useState<MockPricingPolicy[]>([])

    // Service modal state
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
    const [serviceFormState, setServiceFormState] = useState<ServiceFormState>({
        name: '',
        code: '',
        category: 'Khám',
        unit: 'lần',
        duration: 30,
        description: '',
        basePrice: 0,
        status: 'active',
    })
    const [serviceFormErrors, setServiceFormErrors] = useState<ServiceFormErrors>({})

    // Pricing modal state
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false)
    const [editingPricingId, setEditingPricingId] = useState<string | null>(null)
    const [pricingFormState, setPricingFormState] = useState<PricingFormState>({
        serviceId: '',
        type: 'Niêm yết',
        price: 0,
        effectiveDate: '',
        expiryDate: '',
        status: 'active',
    })
    const [pricingFormErrors, setPricingFormErrors] = useState<PricingFormErrors>({})

    const [serviceSearchTerm, setServiceSearchTerm] = useState('')
    const [pricingSearchService, setPricingSearchService] = useState('')

    const { addToast } = useToast()
    const { confirm } = useConfirm()

    // Load mock data
    useEffect(() => {
        const timer = setTimeout(() => {
            setServices(generateMockServices(10))
            setPricingPolicies(generateMockPricingPolicies(15))
        }, 500)
        return () => clearTimeout(timer)
    }, [])

    // Filter services
    const filteredServices = useMemo(() => {
        if (!serviceSearchTerm.trim()) return services
        const keyword = serviceSearchTerm.toLowerCase()
        return services.filter(
            (s) => s.name.toLowerCase().includes(keyword) || s.code.toLowerCase().includes(keyword)
        )
    }, [services, serviceSearchTerm])

    // Filter pricing
    const filteredPricingPolicies = useMemo(() => {
        if (!pricingSearchService.trim()) return pricingPolicies
        const keyword = pricingSearchService.toLowerCase()
        return pricingPolicies.filter((p) => p.serviceName.toLowerCase().includes(keyword))
    }, [pricingPolicies, pricingSearchService])

    // Service modal functions
    function openCreateServiceModal() {
        setEditingServiceId(null)
        setServiceFormState({
            name: '',
            code: `DV-${String(services.length + 1).padStart(3, '0')}`,
            category: 'Khám',
            unit: 'lần',
            duration: 30,
            description: '',
            basePrice: 0,
            status: 'active',
        })
        setServiceFormErrors({})
        setIsServiceModalOpen(true)
    }

    function openEditServiceModal(service: MockService) {
        setEditingServiceId(service.id)
        setServiceFormState({
            name: service.name,
            code: service.code,
            category: service.category,
            unit: service.unit,
            duration: service.duration,
            description: service.description,
            basePrice: service.basePrice,
            status: service.status,
        })
        setServiceFormErrors({})
        setIsServiceModalOpen(true)
    }

    function validateServiceForm(): boolean {
        const errors: ServiceFormErrors = {}
        if (!serviceFormState.name.trim()) errors.name = 'Tên dịch vụ không được để trống'
        if (serviceFormState.basePrice <= 0) errors.basePrice = 'Giá cơ bản phải lớn hơn 0'
        if (serviceFormState.duration <= 0) errors.duration = 'Thời gian phải lớn hơn 0'
        setServiceFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    function handleSaveService() {
        if (!validateServiceForm()) return

        if (editingServiceId) {
            setServices((prev) =>
                prev.map((s) =>
                    s.id === editingServiceId ? { ...s, ...serviceFormState } : s
                )
            )
            addToast('success', 'Cập nhật dịch vụ thành công')
        } else {
            const newService: MockService = {
                id: `srv-${Date.now()}`,
                ...serviceFormState,
            }
            setServices((prev) => [newService, ...prev])
            addToast('success', 'Tạo dịch vụ mới thành công')
        }

        setIsServiceModalOpen(false)
    }

    async function handleDeleteService(service: MockService) {
        const confirmed = await confirm({
            title: 'Xóa dịch vụ',
            message: `Bạn có chắc muốn xóa dịch vụ "${service.name}"?`,
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            isDangerous: true,
        })
        if (confirmed) {
            setServices((prev) => prev.filter((s) => s.id !== service.id))
            addToast('success', 'Xóa dịch vụ thành công')
        }
    }

    // Pricing modal functions
    function openCreatePricingModal() {
        setEditingPricingId(null)
        setPricingFormState({
            serviceId: services[0]?.id || '',
            type: 'Niêm yết',
            price: 0,
            effectiveDate: new Date().toISOString().split('T')[0],
            expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'active',
        })
        setPricingFormErrors({})
        setIsPricingModalOpen(true)
    }

    function openEditPricingModal(policy: MockPricingPolicy) {
        setEditingPricingId(policy.id)
        setPricingFormState({
            serviceId: policy.serviceId,
            type: policy.type,
            price: policy.price,
            effectiveDate: new Date(policy.effectiveDate).toISOString().split('T')[0],
            expiryDate: new Date(policy.expiryDate).toISOString().split('T')[0],
            status: policy.status,
        })
        setPricingFormErrors({})
        setIsPricingModalOpen(true)
    }

    function validatePricingForm(): boolean {
        const errors: PricingFormErrors = {}
        if (!pricingFormState.serviceId) errors.serviceId = 'Vui lòng chọn dịch vụ'
        if (pricingFormState.price <= 0) errors.price = 'Giá phải lớn hơn 0'
        if (new Date(pricingFormState.expiryDate) <= new Date(pricingFormState.effectiveDate)) {
            errors.expiryDate = 'Ngày hết hạn phải sau ngày áp dụng'
        }
        setPricingFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    function handleSavePricing() {
        if (!validatePricingForm()) return

        const selectedService = services.find((s) => s.id === pricingFormState.serviceId)
        if (!selectedService) return

        if (editingPricingId) {
            setPricingPolicies((prev) =>
                prev.map((p) =>
                    p.id === editingPricingId
                        ? {
                            ...p,
                            ...pricingFormState,
                            serviceName: selectedService.name,
                        }
                        : p
                )
            )
            addToast('success', 'Cập nhật chính sách giá thành công')
        } else {
            const newPolicy: MockPricingPolicy = {
                id: `pp-${Date.now()}`,
                ...pricingFormState,
                serviceName: selectedService.name,
            }
            setPricingPolicies((prev) => [newPolicy, ...prev])
            addToast('success', 'Tạo chính sách giá mới thành công')
        }

        setIsPricingModalOpen(false)
    }

    async function handleDeletePricing(policy: MockPricingPolicy) {
        const confirmed = await confirm({
            title: 'Xóa chính sách giá',
            message: `Bạn có chắc muốn xóa chính sách giá cho dịch vụ "${policy.serviceName}"?`,
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            isDangerous: true,
        })
        if (confirmed) {
            setPricingPolicies((prev) => prev.filter((p) => p.id !== policy.id))
            addToast('success', 'Xóa chính sách giá thành công')
        }
    }

    return (
        <section className="space-y-6">
            <PageShell
                title="Danh mục dịch vụ"
                description="Quản lý danh mục dịch vụ nha khoa và chính sách giá. Tạo, chỉnh sửa, xóa dịch vụ và quản lý giá bán."
                testId="page-services"
            />

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-4 py-3 text-sm font-medium ${
                        activeTab === 'services'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Danh mục dịch vụ
                </button>
                <button
                    onClick={() => setActiveTab('pricing')}
                    className={`px-4 py-3 text-sm font-medium ${
                        activeTab === 'pricing'
                            ? 'border-b-2 border-blue-600 text-blue-600'
                            : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                    Chính sách giá
                </button>
            </div>

            {/* Services Tab */}
            {activeTab === 'services' && (
                <div className="space-y-4">
                    {/* Search and Add */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <input
                            type="text"
                            value={serviceSearchTerm}
                            onChange={(e) => setServiceSearchTerm(e.target.value)}
                            placeholder="Tìm kiếm theo tên hoặc mã dịch vụ..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring md:max-w-sm"
                        />
                        <button
                            onClick={openCreateServiceModal}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm dịch vụ
                        </button>
                    </div>

                    {/* Services Table */}
                    {filteredServices.length === 0 ? (
                        <EmptyState title="Không tìm thấy dịch vụ" description="Không có dịch vụ phù hợp với tìm kiếm của bạn" />
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-4 py-3 font-semibold text-slate-700">Mã dịch vụ</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Tên dịch vụ</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Danh mục</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Thời gian (phút)</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Giá cơ bản</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Trạng thái</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredServices.map((service) => (
                                        <tr key={service.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{service.code}</td>
                                            <td className="px-4 py-3 font-medium text-slate-900">{service.name}</td>
                                            <td className="px-4 py-3 text-slate-700">{service.category}</td>
                                            <td className="px-4 py-3 text-slate-700">{service.duration}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{formatVND(service.basePrice)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        service.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-900'
                                                            : 'bg-slate-100 text-slate-800'
                                                    }`}
                                                >
                                                    {service.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditServiceModal(service)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteService(service)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
                <div className="space-y-4">
                    {/* Search and Add */}
                    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                        <input
                            type="text"
                            value={pricingSearchService}
                            onChange={(e) => setPricingSearchService(e.target.value)}
                            placeholder="Tìm kiếm theo tên dịch vụ..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring md:max-w-sm"
                        />
                        <button
                            onClick={openCreatePricingModal}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white transition hover:bg-blue-800"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm chính sách
                        </button>
                    </div>

                    {/* Pricing Table */}
                    {filteredPricingPolicies.length === 0 ? (
                        <EmptyState title="Không tìm thấy chính sách giá" description="Không có chính sách giá phù hợp với tìm kiếm của bạn" />
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <table className="min-w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="px-4 py-3 font-semibold text-slate-700">Dịch vụ</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Loại giá</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Giá</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Áp dụng từ</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Áp dụng đến</th>
                                        <th className="px-4 py-3 font-semibold text-slate-700">Trạng thái</th>
                                        <th className="px-4 py-3 text-right font-semibold text-slate-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filteredPricingPolicies.map((policy) => (
                                        <tr key={policy.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{policy.serviceName}</td>
                                            <td className="px-4 py-3 text-slate-700">{policy.type}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-900">{formatVND(policy.price)}</td>
                                            <td className="px-4 py-3 text-slate-700 text-sm">{formatDate(policy.effectiveDate)}</td>
                                            <td className="px-4 py-3 text-slate-700 text-sm">{formatDate(policy.expiryDate)}</td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        policy.status === 'active'
                                                            ? 'bg-emerald-100 text-emerald-900'
                                                            : 'bg-slate-100 text-slate-800'
                                                    }`}
                                                >
                                                    {policy.status === 'active' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditPricingModal(policy)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-blue-600"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeletePricing(policy)}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Service Modal */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {editingServiceId ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
                            </h3>
                            <button
                                onClick={() => setIsServiceModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Tên dịch vụ *</label>
                                    <input
                                        type="text"
                                        value={serviceFormState.name}
                                        onChange={(e) => setServiceFormState((prev) => ({ ...prev, name: e.target.value }))}
                                        placeholder="Nhập tên dịch vụ"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {serviceFormErrors.name && <p className="mt-1 text-xs text-rose-600">{serviceFormErrors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Mã dịch vụ</label>
                                    <input
                                        type="text"
                                        value={serviceFormState.code}
                                        disabled
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Danh mục</label>
                                    <select
                                        value={serviceFormState.category}
                                        onChange={(e) =>
                                            setServiceFormState((prev) => ({
                                                ...prev,
                                                category: e.target.value as MockService['category'],
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Đơn vị</label>
                                    <select
                                        value={serviceFormState.unit}
                                        onChange={(e) =>
                                            setServiceFormState((prev) => ({
                                                ...prev,
                                                unit: e.target.value as MockService['unit'],
                                            }))
                                        }
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        {UNITS.map((unit) => (
                                            <option key={unit} value={unit}>{unit}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Thời gian (phút) *</label>
                                    <input
                                        type="number"
                                        value={serviceFormState.duration}
                                        onChange={(e) => setServiceFormState((prev) => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                        placeholder="30"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {serviceFormErrors.duration && <p className="mt-1 text-xs text-rose-600">{serviceFormErrors.duration}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-900">Mô tả</label>
                                <textarea
                                    value={serviceFormState.description}
                                    onChange={(e) => setServiceFormState((prev) => ({ ...prev, description: e.target.value }))}
                                    placeholder="Nhập mô tả chi tiết dịch vụ"
                                    rows={3}
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Giá cơ bản (VND) *</label>
                                    <input
                                        type="number"
                                        value={serviceFormState.basePrice}
                                        onChange={(e) => setServiceFormState((prev) => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))}
                                        placeholder="0"
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {serviceFormErrors.basePrice && <p className="mt-1 text-xs text-rose-600">{serviceFormErrors.basePrice}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Trạng thái</label>
                                    <select
                                        value={serviceFormState.status}
                                        onChange={(e) => setServiceFormState((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsServiceModalOpen(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveService}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {editingServiceId ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pricing Modal */}
            {isPricingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">
                                {editingPricingId ? 'Chỉnh sửa chính sách giá' : 'Thêm chính sách giá mới'}
                            </h3>
                            <button
                                onClick={() => setIsPricingModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Dịch vụ *</label>
                                    <select
                                        value={pricingFormState.serviceId}
                                        onChange={(e) => setPricingFormState((prev) => ({ ...prev, serviceId: e.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="">Chọn dịch vụ</option>
                                        {services.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {pricingFormErrors.serviceId && <p className="mt-1 text-xs text-rose-600">{pricingFormErrors.serviceId}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Loại giá</label>
                                    <select
                                        value={pricingFormState.type}
                                        onChange={(e) => setPricingFormState((prev) => ({ ...prev, type: e.target.value as typeof pricingFormState.type }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option>Niêm yết</option>
                                        <option>Bảo hiểm</option>
                                        <option>Ưu đãi</option>
                                        <option>VIP</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-900">Giá (VND) *</label>
                                <input
                                    type="number"
                                    value={pricingFormState.price}
                                    onChange={(e) => setPricingFormState((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                                    placeholder="0"
                                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                />
                                {pricingFormErrors.price && <p className="mt-1 text-xs text-rose-600">{pricingFormErrors.price}</p>}
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Áp dụng từ *</label>
                                    <input
                                        type="date"
                                        value={pricingFormState.effectiveDate}
                                        onChange={(e) => setPricingFormState((prev) => ({ ...prev, effectiveDate: e.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Áp dụng đến *</label>
                                    <input
                                        type="date"
                                        value={pricingFormState.expiryDate}
                                        onChange={(e) => setPricingFormState((prev) => ({ ...prev, expiryDate: e.target.value }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    />
                                    {pricingFormErrors.expiryDate && <p className="mt-1 text-xs text-rose-600">{pricingFormErrors.expiryDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-900">Trạng thái</label>
                                    <select
                                        value={pricingFormState.status}
                                        onChange={(e) => setPricingFormState((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                                        className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-blue-200 transition focus:ring"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setIsPricingModalOpen(false)}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSavePricing}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                {editingPricingId ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
