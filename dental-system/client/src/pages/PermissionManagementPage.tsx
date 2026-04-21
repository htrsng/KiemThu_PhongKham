import { PageShell } from '../components/PageShell'

export function PermissionManagementPage() {
    return (
        <PageShell
            title="Phân quyền"
            description="Ma trận quyền truy cập theo vai trò và chức năng sẽ được dựng ở bước tiếp theo với các checkbox View, Create, Edit và Delete."
            testId="page-permissions"
        />
    )
}