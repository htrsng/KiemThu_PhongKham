describe('[SMOKE] SmileCare — Happy Path', () => {
  it('Dang nhap Admin thanh cong', () => {
    cy.login('admin');
  });

  it('Tao ca lam viec mau', () => {
    cy.login('admin');
    cy.visit('/schedule/shifts');
    // ... smoke test UC2.2
  });

  it('Check-in benh nhan', () => {
    cy.login('le_tan');
    cy.visit('/checkin');
    // ... smoke test UC3.1
  });
});
