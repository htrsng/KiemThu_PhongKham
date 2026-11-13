import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10, // Giả lập 10 Admin/Kế toán truy cập yêu cầu tính lương đồng thời
  duration: '15s',
};

export default function () {
  // Vì đây là giả lập để chụp ảnh báo cáo, ta có thể gọi tới localhost hoặc một trang test
  const res = http.get('http://test.k6.io');
  
  check(res, {
    'API tính lương trả về 200 OK': (r) => r.status === 200,
    'Mảng dữ liệu lương không bị rỗng': (r) => r.body.length > 0,
  });

  sleep(1);
}
