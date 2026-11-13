const api = () => Cypress.env('API_URL');
function token(role) {
  return cy.request({ method: 'POST', url: `${api()}/auth/login`, log: false,
    body: { email: Cypress.env(`${role}_USER`), password: Cypress.env(`${role}_PASS`) } })
    .then(({ body }) => body.token);
}
function request(auth, path) {
  return cy.request({ url: `${api()}${path}`, headers: { Authorization: `Bearer ${auth}` }, failOnStatusCode: false, log: false });
}
describe('Independent role and business workflows', () => {
  afterEach(() => cy.task('qa:cleanup', null, { log: false }));

  it('TC-AUTHZ-001: Admin opens accounts and API returns account records', () => {
    cy.login('admin');
    cy.get('[data-testid="nav-accounts"]').click();
    cy.get('[data-testid="page-accounts"]').should('be.visible');
    token('ADMIN').then((auth) => request(auth, '/accounts')).then(({ status, body }) => {
      expect(status).to.equal(200);
      expect(body.data).to.be.an('array').and.not.be.empty;
    });
  });

  for (const role of ['DOCTOR', 'RECEPTION']) {
    it(`TC-AUTHZ-${role === 'DOCTOR' ? '002' : '003'}: ${role} has no accounts menu and API returns 403`, () => {
      cy.login(role.toLowerCase());
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
      cy.get('[data-testid="nav-accounts"]').should('not.exist');
      token(role).then((auth) => request(auth, '/accounts')).its('status').should('equal', 403);
    });
  }

  it('TC-APPT-014: Reception checks in a patient through UI and state persists', () => {
    cy.task('qa:create', {}, { log: false }).then((f) => {
      cy.login('reception');
      cy.intercept('PATCH', `**/api/appointments/${f.appointmentId}/checkin`).as('checkin');
      cy.get('[data-testid="nav-reception"]').click();
      cy.get(`[data-testid="apt-row-${f.appointmentId}"]`).within(() => {
        cy.contains('button', 'Check-in').click();
      });
      cy.wait('@checkin').its('response.statusCode').should('equal', 200);
      cy.get(`[data-testid="apt-row-${f.appointmentId}"]`).should('contain.text', 'Đã đến');
      token('RECEPTION').then((auth) => request(auth, `/appointments/${f.appointmentId}`))
        .then(({ body }) => {
          expect(body.data.status).to.equal('Đã đến');
          expect(body.data.checkInTime).to.be.a('string');
        });
      cy.screenshot('reception-checkin-persisted');
    });
  });

  it('TC-PAY-002: Reception opens a real invoice and sees its patient and amount', () => {
    cy.task('qa:create', { invoice: true, status: 'Đã hoàn thành' }, { log: false }).then((f) => {
      cy.login('reception');
      cy.get('[data-testid="nav-payment"]').click();
      cy.get('input[placeholder="Tìm tên KH hoặc mã HD..."]').type(f.patientName);
      cy.contains(f.patientName).click();
      cy.contains('Cập nhật thanh toán').should('be.visible');
      cy.contains('100.000').should('be.visible');
      token('RECEPTION').then((auth) => request(auth, `/invoices/${f.invoiceId}`))
        .then(({ body }) => {
          expect(body.data.patientName).to.equal(f.patientName);
          expect(body.data.status).to.equal('Chưa thanh toán');
        });
      cy.screenshot('invoice-detail');
    });
  });
});
