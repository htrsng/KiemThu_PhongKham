import './commands';
import 'cypress-mochawesome-reporter/register';

beforeEach(() => {
  // Xóa storage trước mỗi test tránh dùng dữ liệu cũ
  cy.clearLocalStorage();
  cy.clearCookies();
});
