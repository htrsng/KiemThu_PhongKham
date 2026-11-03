class LoginPage {
  visit() { cy.visit('/login'); }
  fillUsername(val) { cy.get('#username').clear().type(val); }
  fillPassword(val) { cy.get('[name=password]').clear().type(val); }
  submit() { cy.contains('button', 'Đăng nhập').click(); }
  errorMsg() { return cy.get('.error-message'); } // fallback class, team FE se sua lai bang data-cy
  lockWarning() { return cy.get('.account-locked-warning'); }
}
module.exports = new LoginPage();
