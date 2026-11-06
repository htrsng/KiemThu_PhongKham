import axios from 'axios'

// Giả sử bạn lưu token trong localStorage sau khi đăng nhập
const getToken = () => localStorage.getItem('authToken');

export const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 15000,
})

// Interceptor để tự động đính kèm token vào mỗi request
api.interceptors.request.use(
    (config) => {
        const token = getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor để xử lý các lỗi response chung
api.interceptors.response.use(
    (response) => response,
    (error) => { // error là một AxiosError
        if (axios.isAxiosError(error) && error.response) {
            const status = error.response.status;
            const data = error.response.data;

            // Sai thông tin đăng nhập cần được form hiển thị, không tải lại trang.
            const isAuthenticationSubmission = /\/auth\/(login|register)(?:\?|$)/.test(error.config?.url || '');
            if (status === 401 && !isAuthenticationSubmission) {
            // Token không hợp lệ hoặc hết hạn
            // Xóa token và chuyển hướng về trang đăng nhập
            localStorage.removeItem('authToken');
            window.location.href = '/login';
                // Không cần làm gì thêm vì trang sẽ reload
                return Promise.reject(error);
            }

            if (status === 403) {
                // Người dùng không có quyền truy cập tài nguyên này
                // Có thể hiển thị toast thông báo
                console.error('Lỗi phân quyền:', data?.message || 'Bạn không có quyền thực hiện hành động này.');
            }

            if (status >= 500) {
                // Lỗi từ server
                console.error('Lỗi máy chủ:', data?.message || 'Đã có lỗi xảy ra phía máy chủ.');
            }
        }
        
        // Trả về lỗi để các hàm gọi .catch() có thể xử lý tiếp
        return Promise.reject(error);
    }
);

export type ApiListResponse<T> = {
    data: T[]
    total?: number
}

export type ApiItemResponse<T> = {
    data: T
}

export type ApiDeleteResponse = {
    deletedCount: number
}
