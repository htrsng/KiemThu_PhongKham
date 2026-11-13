const api = () => Cypress.env('API_URL');
function token(role) {
  return cy.request({ method: 'POST', url: `${api()}/auth/login`, log: false,
    body: { email: Cypress.env(`${role}_USER`), password: Cypress.env(`${role}_PASS`) } })
    .then(({ body }) => body.token);
}
function request(auth, path) {
  return cy.request({ url: `${api()}${path}`, headers: { Authorization: `Bearer ${auth}` }, failOnStatusCode: false, log: false });
}
function observe(data) {
  return cy.task('qa:observe', { name: Cypress.currentTest.title, data }, { log: false });
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
    cy.task('qa:create', { offsetMinutes: 0 }, { log: false }).then((f) => {
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
          observe({ httpStatus: 200, appointmentStatus: body.data.status, checkInTime: body.data.checkInTime });
        });
      cy.screenshot('reception-checkin-persisted');
    });
  });

  it('TC-PAY-002: Reception opens a real invoice and sees its patient and amount', () => {
    cy.task('qa:create', { invoice: true, status: 'Đã hoàn thành' }, { log: false }).then((f) => {
      cy.login('reception');
      cy.get('[data-testid="nav-payment"]').click();
      cy.get('[data-testid="invoice-search"]').type(f.patientName);
      cy.get(`[data-testid="invoice-row-${f.invoiceId}"]`).click();
      cy.contains('Cập nhật thanh toán').should('be.visible');
      cy.contains('100.000').should('be.visible');
      token('RECEPTION').then((auth) => request(auth, `/invoices/${f.invoiceId}`))
        .then(({ body }) => {
          expect(body.data.patientName).to.equal(f.patientName);
          expect(body.data.status).to.equal('Chưa thanh toán');
          observe({ httpStatus: 200, invoiceStatus: body.data.status, finalAmount: body.data.finalAmount });
        });
      cy.screenshot('invoice-detail');
    });
  });

  it('TC-PAY-017: excessive discount shows a validation error and sends no payment request', () => {
    cy.task('qa:create', { invoice: true, status: 'Đã hoàn thành' }, { log: false }).then((f) => {
      let writes = 0;
      cy.login('reception');
      cy.intercept('PATCH', `**/api/invoices/${f.invoiceId}`, () => { writes++; });
      cy.get('[data-testid="nav-payment"]').click();
      cy.get('[data-testid="invoice-search"]').type(f.patientName);
      cy.get(`[data-testid="invoice-row-${f.invoiceId}"]`).click();
      cy.get('[data-testid="payment-discount"]').clear().type('100001');
      cy.get('[data-testid="payment-confirm"]').click();
      cy.contains('Giảm giá không được vượt quá tổng tiền!').should('be.visible');
      cy.then(() => expect(writes, 'invalid payment requests').to.equal(0));
      token('RECEPTION').then((auth) => request(auth, `/invoices/${f.invoiceId}`)).then(({ body }) => {
        expect(body.data.status).to.equal('Chưa thanh toán');
        expect(body.data.amountPaid).to.equal(0);
        observe({ invoiceStatus: body.data.status, amountPaid: body.data.amountPaid, invalidPaymentRequests: writes });
      });
    });
  });

  it('BUG-004 / TC-APPT-014 / TC-APPT-018 / TC-PAY-003: check-in UI to treatment API to cash payment UI', () => {
    cy.task('qa:create', { offsetMinutes: 0 }, { log: false }).then((f) => {
      cy.login('reception');
      cy.intercept('PATCH', `**/api/appointments/${f.appointmentId}/checkin`).as('flowCheckin');
      cy.get('[data-testid="nav-reception"]').click();
      cy.get(`[data-testid="apt-row-${f.appointmentId}"]`).contains('button', 'Check-in').click();
      cy.wait('@flowCheckin').its('response.statusCode').should('equal', 200);
      token('DOCTOR').then((auth) => {
        const headers = { Authorization: `Bearer ${auth}` };
        cy.request({ method: 'PATCH', url: `${api()}/appointments/${f.appointmentId}`, headers, body: { status: 'Đang điều trị' }, log: false });
        cy.request({ method: 'PATCH', url: `${api()}/appointments/${f.appointmentId}`, headers, body: { status: 'Đã hoàn thành' }, log: false });
      });
      token('RECEPTION').then((auth) => request(auth, `/invoices?appointmentId=${f.appointmentId}`)).then(({ body }) => {
        expect(body.data).to.have.length(1);
        const invoice = body.data[0];
        cy.intercept('PATCH', `**/api/invoices/${invoice.id}`).as('cashPayment');
        cy.get('[data-testid="nav-payment"]').click();
        cy.get('[data-testid="invoice-search"]').type(f.patientName);
        cy.get(`[data-testid="invoice-row-${invoice.id}"]`).click();
        cy.get('[data-testid="payment-method"]').select('Tiền mặt');
        cy.get('[data-testid="payment-confirm"]').click();
        cy.wait('@cashPayment').its('response.statusCode').should('equal', 200);
        cy.get(`[data-testid="invoice-row-${invoice.id}"]`).should('contain.text', 'Đã thanh toán');
        token('RECEPTION').then((auth) => request(auth, `/invoices/${invoice.id}`)).then(({ body }) => {
          return observe({ status: body.data.status, paymentMethod: body.data.paymentMethod,
            amountPaid: body.data.amountPaid, finalAmount: body.data.finalAmount, debt: body.data.debt }).then(() => {
            expect(body.data.status).to.equal('Đã thanh toán');
            expect(body.data.paymentMethod).to.equal('Tiền mặt');
            expect(body.data.amountPaid).to.equal(body.data.finalAmount);
            expect(body.data.debt).to.equal(0);
          });
        });
      });
    });
  });
});
