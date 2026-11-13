// Sign in through the real UI with the three supported application roles.
Cypress.Commands.add('login', (role = 'admin') => {
  const users = {
    admin:    { user: Cypress.env('ADMIN_USER'),    pass: Cypress.env('ADMIN_PASS') },
    doctor:   { user: Cypress.env('DOCTOR_USER'),   pass: Cypress.env('DOCTOR_PASS') },
    reception:{ user: Cypress.env('RECEPTION_USER'),pass: Cypress.env('RECEPTION_PASS') },
  };
  
  if (!users[role] || !users[role].user || !users[role].pass) {
    throw new Error(`Missing test credentials for role: ${role}`);
  }
  const { user, pass } = users[role];
  cy.visit('/login');
  cy.get('[data-cy=login-email]').clear().type(user);
  cy.get('[data-cy=login-password]').clear().type(pass, { log: false });
  cy.contains('button', 'Đăng nhập').click();
  cy.location('pathname').should('equal', '/');
});
