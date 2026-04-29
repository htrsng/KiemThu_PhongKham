import { Search } from 'lucide-react'

type EmptyStateProps = {
    title?: string
    description?: string
    onClearFilters?: () => void
    showClearButton?: boolean
}

export function EmptyState({
    title = 'Không tìm thấy kết quả',
    description = 'Không có dữ liệu để hiển thị',
    onClearFilters,
    showClearButton = false,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 px-6 py-16">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                <Search className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-600">{description}</p>
            {showClearButton && onClearFilters && (
                <button
                    onClick={onClearFilters}
                    className="mt-4 rounded-lg bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200"
                >
                    Xóa bộ lọc
                </button>
            )}
        </div>
    )
}
