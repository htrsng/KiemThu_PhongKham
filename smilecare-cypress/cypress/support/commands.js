// cy.login('admin') | cy.login('le_tan') | cy.login('bac_si') | cy.login('thu_ngan')
Cypress.Commands.add('login', (role = 'admin') => {
  const users = {
    admin:    { user: Cypress.env('ADMIN_USER'),    pass: Cypress.env('ADMIN_PASS') },
    le_tan:   { user: Cypress.env('LE_TAN_USER'),   pass: Cypress.env('LE_TAN_PASS') },
    bac_si:   { user: Cypress.env('BAC_SI_USER'),   pass: Cypress.env('BAC_SI_PASS') },
    thu_ngan: { user: Cypress.env('THU_NGAN_USER'), pass: Cypress.env('THU_NGAN_PASS') },
  };
  
  const { user, pass } = users[role];
  cy.visit('/login');
  cy.get('#username').clear().type(user);
  cy.get('[name=password]').clear().type(pass);
  cy.contains('button', 'Đăng nhập').click();
  cy.url().should('include', '/dashboard');
});

// Chon bac si tren form dat lich
Cypress.Commands.add('selectDoctor', (doctorName) => {
  cy.get('#select-doctor').click();
  cy.contains('.doctor-option', doctorName).click();
});

// Check-in bang ma booking
Cypress.Commands.add('checkIn', (bookingCode) => {
  cy.get('#input-booking-code').clear().type(bookingCode);
  cy.contains('button', 'Check-in').click();
});

// Chon ngay tren date-picker
Cypress.Commands.add('pickDate', (selector, dateStr) => {
  cy.get(selector).clear().type(dateStr);
  // Có thể có nut xac nhan hoặc tự động đóng, giả sử click ngoài hoặc nhấn enter
  cy.get(selector).type('{enter}'); 
});

// Dang xuat
Cypress.Commands.add('logout', () => {
  cy.get('#user-menu').click();
  cy.contains('button', 'Đăng xuất').click();
  cy.url().should('include', '/login');
});

// Kiem tra thong bao toast
Cypress.Commands.add('toastShouldContain', (text) => {
  cy.get('.toast, [role=alert]')
    .should('be.visible')
    .and('contain.text', text);
});

// Intercept API va alias
Cypress.Commands.add('interceptAPI', (method, urlPattern, alias) => {
  cy.intercept(method, urlPattern).as(alias);
});
