class DoctorPage {
  visit() { cy.visit('/doctors'); }
}
module.exports = new DoctorPage();
