import schedulePage from '../pages/SchedulePage';

describe('UC2.4 — Dat lich kham', () => {
  beforeEach(() => cy.login('le_tan'));

  context('[Decision Table] Cac quy tac dat lich', () => {
    it('[TC-UC24-001] Rule 1: BS co lich truc + khong nghi phep + ca chua day', () => {
      cy.fixture('bookings').then(data => {
        schedulePage.visit();
        schedulePage.selectDoctor(data.rule1.doctor);
        schedulePage.selectDate(data.rule1.date);
        schedulePage.selectShift(data.rule1.shift);
        schedulePage.fillPatientName(data.rule1.patientName);
        schedulePage.fillPatientPhone(data.rule1.phone);
        schedulePage.submit();
        
        schedulePage.successMessage()
          .should('be.visible')
          .and('contain.text', 'Dat lich thanh cong');
        
        // Mock intercept if using backend fallback
      });
    });

    it('[TC-UC24-002] Rule 2: BS KHONG co lich truc — Fail Bug#731', () => {
      schedulePage.visit();
      schedulePage.selectDoctor('BS. Nguyen Minh Duc');
      schedulePage.selectDate('2025-06-20');
      
      schedulePage.noShiftAvailable().should('be.visible');
      cy.contains('button', 'Đặt lịch').should('be.disabled');
    });
  });
});
