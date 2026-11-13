# Quy ước đóng góp

- Chỉ dùng DB QA local có tên kết thúc `_test`. Không commit `.env`, password, token, dữ liệu thật hoặc thư viện đã cài.
- Test phải có assertion cho kết quả quan sát được; dữ liệu riêng từng test và cleanup theo ID sở hữu.
- `testing/manual/source-cases.csv` nhập 337 case Excel đã kiểm thử; kết quả lịch sử chuẩn hóa ở `docs/qa/history/`. `test-cases.csv` là 70 thiết kế hồi quy bổ trợ có chồng lấp. Giữ kết quả cũ riêng, không áp sang build mới. Khi đổi case, cập nhật RTM/workbook và chạy `node testing/scripts/audit-qa.js`.
- Mỗi lần chạy có Run ID/build/executor và thư mục riêng; không sửa kết quả đã công bố. Automation Partial không thay cho manual execution. Dùng `node testing/scripts/audit-run.js <run-directory>` để kiểm tra evidence.
- Bug dùng mã `BUG-xxx`, test dùng `TC-AREA-xxx`, yêu cầu dùng `REQ-AREA-xxx`. Bug report ghi bước tái hiện, expected/actual, môi trường và bằng chứng.
- Severity: Critical (mất dữ liệu/chặn hệ thống), High (sai nghiệp vụ quan trọng), Medium (ảnh hưởng có workaround), Low (lỗi nhỏ). Priority: P0 chặn phát hành, P1 chu kỳ hiện tại, P2 chu kỳ sau, P3 backlog.
- Khi đổi mã, chạy build và các bộ kiểm thử liên quan. Không đổi Fail thành Pass bằng cách bỏ assertion; chỉ đóng bug sau retest. Báo cáo ghi revision, môi trường và phạm vi đã chạy.
