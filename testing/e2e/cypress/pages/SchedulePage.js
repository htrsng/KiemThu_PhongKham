class SchedulePage {
  visit() { cy.visit('/schedule/booking'); }
  selectDoctor(name) { cy.selectDoctor(name); }
  selectDate(date) { cy.pickDate('#booking-date', date); }
  selectShift(shift) { cy.get(`#shift-${shift}`).click(); }
  fillPatientName(name) { cy.get('#patient-name').clear().type(name); }
  fillPatientPhone(phone) { cy.get('#patient-phone').clear().type(phone); }
  submit() { cy.contains('button', 'Đặt lịch').click(); }
  successMessage() { return cy.get('.booking-success'); }
  noShiftAvailable() { return cy.get('.no-shift-msg'); }
}
module.exports = new SchedulePage();
