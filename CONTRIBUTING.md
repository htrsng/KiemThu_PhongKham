# Quy ước đóng góp

- Chỉ dùng DB QA local có tên kết thúc `_test`. Không commit `.env`, password, token, dữ liệu thật hoặc thư viện đã cài.
- Test phải có assertion cho kết quả quan sát được; dữ liệu riêng từng test và cleanup theo ID sở hữu.
- `testing/manual/test-cases.csv` là nguồn thiết kế manual duy nhất. Khi đổi case, cập nhật RTM và workbook tương ứng rồi chạy `node testing/scripts/audit-qa.js`.
- Bug dùng mã `BUG-xxx`, test dùng `TC-AREA-xxx`, yêu cầu dùng `REQ-AREA-xxx`. Bug report ghi bước tái hiện, expected/actual, môi trường và bằng chứng.
- Severity: Critical (mất dữ liệu/chặn hệ thống), High (sai nghiệp vụ quan trọng), Medium (ảnh hưởng có workaround), Low (lỗi nhỏ). Priority: P0 chặn phát hành, P1 chu kỳ hiện tại, P2 chu kỳ sau, P3 backlog.
- Khi đổi mã, chạy build và các bộ kiểm thử liên quan. Không đổi Fail thành Pass bằng cách bỏ assertion; chỉ đóng bug sau retest. Báo cáo ghi revision, môi trường và phạm vi đã chạy.
