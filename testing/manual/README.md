# Bộ test case thủ công

`test-cases.csv` là bản CSV chính để mở bằng Excel; `test-cases.tsv` là bản TSV
tương đương để import vào Google Sheets hoặc các công cụ xử lý bảng.

Các cột gồm:

`ID`, `Module`, `Description`, `Precondition`, `Test data`, `Steps`, `Expected`, `Priority`, `Type`, `Technique`.

Credential và dữ liệu định danh trong test data là placeholder. Khi chạy, thay bằng dữ liệu được sinh trong môi trường QA; không ghi mật khẩu thật vào file này.
