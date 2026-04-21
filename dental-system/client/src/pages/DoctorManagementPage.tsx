import { PageShell } from '../components/PageShell'

export function DoctorManagementPage() {
    return (
        <PageShell
            title="Quản lý bác sĩ"
            description="Trang này sẽ chứa grid thẻ bác sĩ, thanh tìm kiếm, thông tin chuyên khoa, số giấy phép và modal chi tiết hồ sơ."
            testId="page-doctors"
        />
    )
}