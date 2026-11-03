import loginPage from '../pages/LoginPage';

describe('UC0 — Dang nhap va xac thuc', () => {
  context('Positive', () => {
    it('[TC-UC01-001] Dang nhap Admin hop le', () => {
      loginPage.visit();
      loginPage.fillUsername('admin');
      loginPage.fillPassword('Admin@123');
      loginPage.submit();
      cy.url().should('include', '/dashboard');
    });

    it('[TC-UC01-002] Dang nhap Le Tan hop le', () => {
      cy.login('le_tan');
      cy.url().should('include', '/dashboard');
    });
  });

  context('Negative / Boundary', () => {
    it('[TC-UC01-003] Mat khau sai 1 lan — hien thong bao loi', () => {
      loginPage.visit();
      loginPage.fillUsername('admin');
      loginPage.fillPassword('SaiMatKhau');
      loginPage.submit();
      loginPage.errorMsg().should('be.visible').and('contain', 'Sai mat khau');
    });

    it('[TC-UC01-004] Sai mat khau 5 lan — tai khoan bi khoa', () => {
      for (let i = 0; i < 5; i++) {
        loginPage.visit();
        loginPage.fillUsername('admin');
        loginPage.fillPassword('SaiMatKhau' + i);
        loginPage.submit();
      }
      loginPage.lockWarning().should('be.visible');
    });
  });
});
