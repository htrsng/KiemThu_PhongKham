class LoginPage {
  visit() { cy.visit('/login'); }
  fillUsername(value) { cy.get('[data-cy="login-email"]').clear().type(value); }
  fillPassword(value) { cy.get('[data-cy="login-password"]').clear().type(value, { log: false }); }
  submit() { cy.get('[data-cy="login-submit"]').click(); }
  errorMsg() { return cy.get('[data-cy="auth-error"]'); }
  lockWarning() { return this.errorMsg(); }
}
module.exports = new LoginPage();
