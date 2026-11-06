const loginPage = require('../pages/LoginPage');

describe('Đăng nhập — kiểm tra trên backend thật với dữ liệu thử nghiệm', () => {
  before(() => {
    expect(Cypress.env('ADMIN_USER'), 'ADMIN_USER đã được cấu hình').to.be.a('string').and.not.be.empty;
    expect(Cypress.env('ADMIN_PASS'), 'ADMIN_PASS đã được cấu hình').to.be.a('string').and.not.be.empty;
  });

  it('Chuyển người chưa đăng nhập về trang đăng nhập', () => {
    cy.visit('/');
    cy.location('pathname').should('equal', '/login');
    cy.get('[data-cy=login-submit]').should('be.visible');
  });

  it('Không gửi biểu mẫu khi thiếu email và mật khẩu', () => {
    loginPage.visit();
    loginPage.submit();
    cy.get('[data-cy=login-email]').then(($input) => {
      expect($input[0].validity.valueMissing).to.equal(true);
    });
    cy.location('pathname').should('equal', '/login');
  });

  it('Hiển thị lỗi định dạng email không thuộc gmail.com', () => {
    loginPage.visit();
    loginPage.fillUsername('qa@example.invalid');
    loginPage.fillPassword('invalid-input');
    loginPage.submit();
    loginPage.errorMsg().should('contain.text', '@gmail.com');
    cy.location('pathname').should('equal', '/login');
  });

  it('Từ chối mật khẩu sai và không lưu phiên đăng nhập', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    loginPage.visit();
    loginPage.fillUsername(Cypress.env('ADMIN_USER'));
    loginPage.fillPassword(`${Cypress.env('ADMIN_PASS')}invalid`);
    loginPage.submit();
    cy.wait('@login').its('response.statusCode').should('equal', 401);
    loginPage.errorMsg().should('contain.text', 'không chính xác');
    cy.window().then((win) => expect(win.localStorage.getItem('authToken')).to.equal(null));
  });

  it('Đăng nhập tài khoản thử nghiệm và xác minh phiên bằng API /me', () => {
    cy.login('admin');
    cy.window().then((win) => {
      const token = win.localStorage.getItem('authToken');
      expect(token, 'phiên đăng nhập đã lưu').to.be.a('string').and.not.be.empty;
      cy.request({ url: `${Cypress.env('API_URL')}/auth/me`,
        headers: { Authorization: `Bearer ${token}` }, log: false }).then((response) => {
        expect(response.status).to.equal(200);
        expect(response.body.data.email).to.equal(Cypress.env('ADMIN_USER'));
      });
    });
  });
});
