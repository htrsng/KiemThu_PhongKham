class PaymentPage {
  visit() { cy.visit('/payment'); }
}
module.exports = new PaymentPage();
