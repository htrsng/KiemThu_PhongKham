type PageShellProps = {
    title: string
    description: string
    testId: string
}

export function PageShell({ title, description, testId }: PageShellProps) {
    return (
        <section data-testid={testId} className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-900">Module</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>

            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500 shadow-sm">
                Nội dung chi tiết của module sẽ được triển khai ở bước tiếp theo với mock data, bảng biểu và modal.
            </div>
        </section>
    )
}