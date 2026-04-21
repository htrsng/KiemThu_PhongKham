import { PageShell } from '../components/PageShell'

export function AccountManagementPage() {
    return (
        <PageShell
            title="Quản lý tài khoản"
            description="Danh sách tài khoản, trạng thái hoạt động và vai trò người dùng sẽ được hiển thị tại đây bằng bảng dữ liệu và modal tạo/chỉnh sửa."
            testId="page-accounts"
        />
    )
}