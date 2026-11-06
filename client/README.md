# Giao diện SmileCare

Giao diện quản lý phòng khám sử dụng React, TypeScript và Vite. Xem [README chính](../README.md) để thiết lập API và MongoDB.

## Cài đặt và chạy

Dùng Node.js 24. Tại thư mục `client/`:

```sh
npm ci
npm run dev
```

Vite mặc định chạy ở cổng 5173. Giao diện hiện gọi API ở `http://localhost:5000/api`; chạy backend tương ứng trước khi kiểm tra chức năng.

## Các lệnh

- `npm run build`: kiểm tra kiểu TypeScript và biên dịch giao diện.
- `npm run lint`: kiểm tra quy tắc mã nguồn; trạng thái lint không được suy ra từ build.
- `npm run preview`: xem bản giao diện đã biên dịch.

## Kiểm thử

Các trường trên form đăng nhập có `data-cy` để Cypress định vị ổn định. Xem [hướng dẫn QA](../docs/qa/README.md) và [phạm vi kiểm tra](../docs/qa/test-plan.md).
