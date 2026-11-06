class UserManagementPage {
  visit() { cy.visit('/users'); }
}
module.exports = new UserManagementPage();
