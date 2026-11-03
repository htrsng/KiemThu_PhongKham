import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { routeTitleMap } from '../config/navigation'

type BreadcrumbItem = {
    label: string
    path: string
}

export function Breadcrumb() {
    const location = useLocation()

    const breadcrumbs = getBreadcrumbs(location.pathname)

    if (breadcrumbs.length <= 1) {
        return null
    }

    return (
        <nav className="flex items-center gap-2 text-sm text-slate-600">
            {breadcrumbs.map((item, index) => (
                <div key={item.path} className="flex items-center gap-2">
                    {index > 0 && <ChevronRight className="h-4 w-4" />}
                    {index === breadcrumbs.length - 1 ? (
                        <span className="font-medium text-slate-900">{item.label}</span>
                    ) : (
                        <Link to={item.path} className="hover:text-blue-600">
                            {item.label}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    )
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Dashboard', path: '/' }]

    if (pathname !== '/') {
        breadcrumbs.push({
            label: routeTitleMap[pathname] || 'Trang không xác định',
            path: pathname,
        })
    }

    return breadcrumbs
}
