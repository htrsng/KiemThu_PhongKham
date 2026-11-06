import checkInPage from '../pages/CheckInPage';
import examinationPage from '../pages/ExaminationPage';
import paymentPage from '../pages/PaymentPage';

describe('UC3 — Tiep don va kham benh', () => {
  beforeEach(() => cy.login('le_tan'));

  context('UC3.1 - Check-in', () => {
    it('[TC-UC31-001] Check-in thanh cong bang ma booking', () => {
      checkInPage.visit();
      cy.checkIn('BK123456');
      cy.toastShouldContain('Check-in thành công');
    });
  });

  context('UC3.2 - Kham benh', () => {
    it('[TC-UC32-001] Luu benh an thanh cong', () => {
      // Mock or use real backend
      examinationPage.visit();
    });
  });

  // Add more tests for UC3.3 (Thanh toan) and UC3.4 (Doanh thu)
});
