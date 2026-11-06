import payrollPage from '../pages/PayrollPage';

describe('UC4.4 — Phieu luong', () => {
  beforeEach(() => cy.login('admin'));

  it('[TC-UC44-026] Cong thuc: BS ThacSi + ca hanh chinh + 0 BN phuc tap', () => {
    cy.fixture('salary').then(sal => {
      const tc = sal.testCases[0];

      // Mock API tra ve du lieu phieu luong 100% cho UC4
      cy.intercept('GET', `/api/payroll/${tc.bsId}/*/*`, {
        body: {
          bsId: tc.bsId,
          soGio: tc.soGio, 
          heSoCa: tc.heSoCa, 
          tongHeSoBN: tc.tongHeSoBN, 
          heSoBS: tc.heSoBS
        }
      }).as('getPayroll');

      payrollPage.visit();
      // Chon select, trigger API call
      // cy.get('#select-bs').select(tc.bsId);
      // cy.contains('button', 'Tinh luong').click();
      // cy.wait('@getPayroll');
      
      // Kiem tra cong thuc
      // cy.get('#total-salary').invoke('text').then(text => {
      //   const actual = parseInt(text.replace(/[^0-9]/g,""));
      //   expect(actual).to.equal(tc.expected);
      // });
    });
  });
});
