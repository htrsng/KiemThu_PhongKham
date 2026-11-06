import userManagementPage from '../pages/UserManagementPage';
import doctorPage from '../pages/DoctorPage';

describe('UC1 — Quan ly danh muc', () => {
  beforeEach(() => {
    cy.login('admin');
  });

  context('UC1.1 - Quan ly Nguoi dung', () => {
    it('[TC-UC11-001] Hien thi danh sach nguoi dung', () => {
      userManagementPage.visit();
      cy.get('table').should('be.visible');
    });
  });

  context('UC1.2 - Quan ly Bac si', () => {
    it('[TC-UC12-001] Them bac si moi', () => {
      doctorPage.visit();
      // ... steps for adding doctor (mocking API or real backend)
    });
  });

  // Add more tests for UC1.3, UC1.4 here
});
