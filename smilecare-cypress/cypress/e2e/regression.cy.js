describe('Regression — Bug Tracking', () => {
  it('[Bug#599][TC-UC11-008] Password 7 ky tu khong bi chan', () => {
    cy.login('admin');
    cy.visit('/users/new');
    cy.get('#new-password').type('Ab@1234'); // 7 ky tu — duoi min
    cy.contains('button', 'Lưu').click();
    cy.get('.error-password').should('be.visible')
      .and('contain', 'it nhat 8 ky tu');
  });

  it('[Bug#731][TC-UC24-002] BS khong co lich truc van dat duoc lich', () => {
    cy.login('le_tan');
    cy.visit('/schedule/booking');
    cy.selectDoctor('BS. Nguyen Minh Duc');
    cy.pickDate('#booking-date', '2025-06-20');
    cy.get('#shift-morning').should('not.exist');
    cy.get('.no-shift-msg').should('be.visible');
  });
  
  // ... 12 TC con lai
});
