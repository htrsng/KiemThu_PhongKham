import './commands';
import 'cypress-mochawesome-reporter/register';
require('cypress-plugin-tab');

beforeEach(() => {
  // Xóa storage trước mỗi test tránh dùng dữ liệu cũ
  cy.clearLocalStorage();
  cy.clearCookies();
});

Cypress.on('uncaught:exception', (err) => {
  // Ngăn Cypress fail vì lỗi JS không liên quan đến test
  if (err.message.includes('ResizeObserver')) return false;
  return true;
});
