const loginPage = require('../pages/LoginPage');

describe('Đăng nhập — kiểm tra trên backend thật với dữ liệu thử nghiệm', () => {
  before(() => {
    expect(Cypress.env('ADMIN_USER'), 'ADMIN_USER đã được cấu hình').to.be.a('string').and.not.be.empty;
    expect(Cypress.env('ADMIN_PASS'), 'ADMIN_PASS đã được cấu hình').to.be.a('string').and.not.be.empty;
  });

  it('TC-AUTH-010 (UI subset): redirects a missing session to login', () => {
    cy.visit('/');
    cy.location('pathname').should('equal', '/login');
    cy.get('[data-cy=login-submit]').should('be.visible');
  });

  it('TC-AUTH-002 (UI): required credentials prevent empty submission', () => {
    loginPage.visit();
    loginPage.submit();
    cy.get('[data-cy=login-email]').then(($input) => {
      expect($input[0].validity.valueMissing).to.equal(true);
    });
    cy.location('pathname').should('equal', '/login');
  });

  it('TC-AUTH-003 (UI): non-gmail email shows validation feedback', () => {
    loginPage.visit();
    loginPage.fillUsername('qa@example.invalid');
    loginPage.fillPassword('invalid-input');
    loginPage.submit();
    loginPage.errorMsg().should('contain.text', '@gmail.com');
    cy.location('pathname').should('equal', '/login');
  });

  it('BUG-001 / TC-AUTH-005 (UI): wrong password keeps feedback and no session', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    loginPage.visit();
    loginPage.fillUsername(Cypress.env('ADMIN_USER'));
    loginPage.fillPassword(`${Cypress.env('ADMIN_PASS')}invalid`);
    loginPage.submit();
    cy.wait('@login').its('response.statusCode').should('equal', 401);
    loginPage.errorMsg().should('contain.text', 'không chính xác');
    cy.window().then((win) => expect(win.localStorage.getItem('authToken')).to.equal(null));
  });

  it('TC-AUTH-001 / TC-AUTH-012 (UI): login session matches API current account', () => {
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
