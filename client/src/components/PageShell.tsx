import React from 'react';

type PageShellProps = {
    title?: string
    description?: string
    testId?: string
    children?: React.ReactNode
}

export function PageShell({ title, description, testId, children }: PageShellProps) {
    if (!title && children) {
        return <div className="space-y-4 fade-in h-[calc(100vh-80px)] overflow-y-auto pr-2 pb-10">{children}</div>;
    }

    return (
        <section data-testid={testId} className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-900">Module</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">{title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>

            {children}
        </section>
    )
}