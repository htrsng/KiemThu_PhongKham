// Explicit assisted execution of the 40-case inventory. Not selected by the normal E2E glob.
// Real API/UI assertions; no seeded/manual Pass is inferred from source code.
const api = () => Cypress.env('API_URL');
const note = (data) => cy.then(() => cy.task('qa:observe', { name: Cypress.currentTest.title,
  data: { observedAt: new Date().toISOString(), ...data } }, { log: false }));
// Image capture is optional: a screenshot transport timeout is not a product assertion.
const shot = (name) => Cypress.env('ASSISTED_SCREENSHOTS') === true
  ? cy.screenshot(name, { capture: 'viewport' }) : note({ screenshotPending: name });
function safe(body) {
  const data = body?.data;
  const result = {};
  if (Array.isArray(data)) result.recordCount = data.length;
  else if (data && typeof data === 'object') {
    for (const key of ['id', 'status', 'patientId', 'doctorId', 'startTime', 'checkInTime', 'totalAmount', 'finalAmount', 'amountPaid', 'debt', 'paymentMethod']) {
      if (data[key] !== undefined) result[key] = data[key];
    }
  }
  if (body?.error) result.error = body.error;
  return result;
}
function authRequest(email, password) {
  return cy.request({ method: 'POST', url: `${api()}/auth/login`, body: { email, password }, failOnStatusCode: false, log: false })
    .then((r) => note({ method: 'POST', path: '/auth/login', httpStatus: r.status,
      tokenPresent: Boolean(r.body.token), passwordPresent: Object.hasOwn(r.body.account || {}, 'password'),
      role: r.body.account?.role, error: r.body.error }).then(() => r));
}
function token(role) {
  return cy.request({ method: 'POST', url: `${api()}/auth/login`, log: false,
    body: { email: Cypress.env(`${role}_USER`), password: Cypress.env(`${role}_PASS`) } }).then(({ body }) => body.token);
}
function call(role, path, method = 'GET', body) {
  return token(role).then((auth) => cy.request({ method, url: api() + path, body,
    headers: { Authorization: `Bearer ${auth}` }, failOnStatusCode: false, log: false }))
    .then((r) => note({ method, path, httpStatus: r.status, ...safe(r.body) }).then(() => r));
}
function fixture(options, action) {
  return cy.task('qa:create', options || {}, { log: false }).then((f) => note({
    fixtureKey: f.key, appointmentId: f.appointmentId, invoiceId: f.invoiceId,
    patientId: f.appointment.patientId, doctorId: f.appointment.doctorId, serviceId: f.appointment.serviceId,
    startTime: f.appointment.startTime, setupStatus: f.appointment.status,
  }).then(() => action(f)));
}
function stored(f, expected) {
  return call('ADMIN', `/appointments/${f.appointmentId}`).then(({ status, body }) => {
    expect(status).eq(200); expect(body.data.status).eq(expected);
  });
}
function openInvoice(f) {
  cy.login('reception');
  cy.get('[data-testid="nav-payment"]').click();
  cy.get('[data-testid="invoice-search"]').type(f.patientName);
  cy.get(`[data-testid="invoice-row-${f.invoiceId}"]`).click();
  cy.contains('Cập nhật thanh toán').should('be.visible');
}
describe('Assisted verification of 40 priority cases (API/UI, not manual)', () => {
  afterEach(() => cy.task('qa:cleanup', null, { log: false }));
  it('TC-AUTH-001: valid Admin login through UI and response assertions', () => {
    cy.intercept('POST', '**/api/auth/login').as('login');
    cy.login('admin');
    cy.wait('@login').then(({ response: r }) => {
      expect(r.statusCode).eq(200); expect(Boolean(r.body.token)).eq(true);
      expect(r.body.account).not.have.property('password'); expect(r.body.account.role).eq('Admin');
      note({ method: 'POST', path: '/auth/login', httpStatus: r.statusCode, tokenPresent: Boolean(r.body.token), passwordPresent: false, role: 'Admin', ui: 'Dashboard' });
    });
    cy.window().then((w) => expect(Boolean(w.localStorage.getItem('authToken'))).eq(true));
    shot('TC-AUTH-001-dashboard');
  });
  it('TC-AUTH-002: empty email and empty password blocked by UI validation', () => {
    cy.visit('/login');
    cy.get('[data-cy=login-email]').type(Cypress.env('ADMIN_USER'));
    cy.get('[data-cy=login-submit]').click();
    cy.get('[data-cy=login-password]').then(($e) => expect($e[0].validity.valueMissing).eq(true));
    cy.get('[data-cy=login-email]').clear();
    cy.get('[data-cy=login-password]').type(Cypress.env('ADMIN_PASS'), { log: false });
    cy.get('[data-cy=login-submit]').click();
    cy.get('[data-cy=login-email]').then(($e) => expect($e[0].validity.valueMissing).eq(true));
    cy.location('pathname').should('eq', '/login');
    cy.window().then((w) => expect(w.localStorage.getItem('authToken')).eq(null));
    note({ emailRequired: true, passwordRequired: true, sessionPresent: false });
    shot('TC-AUTH-002-required-fields');
  });
  it('TC-AUTH-003: invalid email rejected by API', () => {
    authRequest('user@example.com', 'WrongPassword!1').then((r) => {
      expect(r.status).eq(400); expect(r.body.error).eq('invalid_email_format'); expect(r.body.token).eq(undefined);
    });
  });
  it('TC-AUTH-004: uppercase Gmail login canonicalizes email', () => {
    authRequest(Cypress.env('ADMIN_USER').toUpperCase(), Cypress.env('ADMIN_PASS')).then((r) => {
      expect(r.status).eq(200); expect(Boolean(r.body.token)).eq(true);
      expect(r.body.account.email).eq(Cypress.env('ADMIN_USER').toLowerCase());
      note({ canonicalEmailMatchesSeed: true });
    });
  });
  it('TC-AUTH-005: wrong password keeps UI error and creates no session', () => {
    cy.intercept('POST', '**/api/auth/login').as('wrong');
    cy.visit('/login');
    cy.get('[data-cy=login-email]').type(Cypress.env('ADMIN_USER'));
    cy.get('[data-cy=login-password]').type('WrongPassword!1', { log: false });
    cy.get('[data-cy=login-submit]').click();
    cy.wait('@wrong').then(({ response: r }) => {
      expect(r.statusCode).eq(401); expect(r.body.error).eq('wrong_password');
      note({ httpStatus: r.statusCode, error: r.body.error });
    });
    cy.get('[data-cy=auth-error]').should('contain.text', 'không chính xác');
    cy.window().then((w) => expect(w.localStorage.getItem('authToken')).eq(null));
    shot('TC-AUTH-005-wrong-password');
  });
  it('TC-AUTH-008: locked account rejected', () => {
    expect(Cypress.env('LOCKED_USER')).to.be.a('string').and.not.be.empty;
    authRequest(Cypress.env('LOCKED_USER'), Cypress.env('ADMIN_PASS')).then((r) => {
      expect(r.status).eq(403); expect(r.body.error).eq('locked'); expect(r.body.token).eq(undefined);
    });
  });
  it('TC-AUTH-009: invalid token cannot read current account', () => {
    cy.request({ url: `${api()}/auth/me`, headers: { Authorization: 'Bearer invalid-token' }, failOnStatusCode: false, log: false }).then((r) => {
      note({ method: 'GET', path: '/auth/me', httpStatus: r.status, invalidToken: true, dataPresent: Boolean(r.body.data) });
      expect(r.status).eq(401); expect(r.body.data).eq(undefined);
    });
  });
  it('TC-AUTH-011: UI logout clears session and protects accounts route', () => {
    cy.login('admin');
    cy.get('button[title="Đăng xuất"]').first().click();
    cy.location('pathname').should('eq', '/login');
    cy.window().then((w) => expect(w.localStorage.getItem('authToken')).eq(null));
    cy.visit('/accounts'); cy.location('pathname').should('eq', '/login');
    note({ logoutClearsToken: true, protectedRouteRedirectsToLogin: true });
    shot('TC-AUTH-011-logout');
  });
  for (const [id, role, code] of [['001', 'ADMIN', 200], ['002', 'DOCTOR', 403], ['003', 'RECEPTION', 403]]) {
    it(`TC-AUTHZ-${id}: ${role} accounts API and navigation permissions`, () => {
      cy.login(role.toLowerCase());
      if (role === 'ADMIN') {
        cy.get('[data-testid="nav-accounts"]').click();
        cy.get('[data-testid="page-accounts"]').should('be.visible');
      } else cy.get('[data-testid="nav-accounts"]').should('not.exist');
      call(role, '/accounts').then((r) => {
        expect(r.status).eq(code);
        if (code === 200) expect(r.body.data).to.be.an('array');
        else expect(r.body.data).eq(undefined);
      });
      shot(`TC-AUTHZ-${id}-permissions`);
    });
  }
  it('TC-AUTHZ-004: Admin deletes unpaid fixture invoice', () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
    call('ADMIN', `/invoices/${f.invoiceId}`, 'DELETE').its('status').should('eq', 200);
    call('ADMIN', `/invoices/${f.invoiceId}`).its('status').should('eq', 404);
    stored(f, 'Đã hoàn thành');
  }));
  it('TC-AUTHZ-005: Doctor invoice GET and PATCH both forbidden', () => fixture({ invoice: true }, (f) => {
    call('DOCTOR', `/invoices/${f.invoiceId}`).its('status').should('eq', 403);
    call('DOCTOR', `/invoices/${f.invoiceId}`, 'PATCH', { status: 'Đã thanh toán', finalAmount: 100000, amountPaid: 100000 }).its('status').should('eq', 403);
    call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => { expect(body.data.status).eq('Chưa thanh toán'); expect(body.data.amountPaid).eq(0); });
  }));
  it('TC-AUTHZ-007: Reception cannot delete invoice and original remains', () => fixture({ invoice: true }, (f) => {
    call('RECEPTION', `/invoices/${f.invoiceId}`, 'DELETE').its('status').should('eq', 403);
    call('ADMIN', `/invoices/${f.invoiceId}`).its('status').should('eq', 200);
  }));
  for (const [id, options, expected] of [['001', { appointment: false }, 201], ['002', { appointment: false, offsetMinutes: -60 }, 400],
    ['003', { appointment: false, withShift: false }, 400], ['009', {}, 400]]) {
    it(`TC-APPT-${id}: appointment creation returns ${expected} and persisted inventory matches`, () => fixture(options, (f) => {
      call('ADMIN', '/appointments', 'POST', f.appointment).then((r) => {
        expect(r.status).eq(expected);
        if (expected === 201) expect(r.body.data.status).eq('Đã lên lịch');
      });
      call('ADMIN', `/appointments?doctorId=${f.appointment.doctorId}`).then(({ body }) => {
        expect(body.data).to.have.length(id === '001' || id === '009' ? 1 : 0);
      });
    }));
  }
  for (const [id, offset, initial, expected] of [['011', 29, 'Đã lên lịch', 200], ['013', -31, 'Đã lên lịch', 400],
    ['014', 0, 'Đã lên lịch', 200], ['015', 0, 'Đã đến', 400]]) {
    it(`TC-APPT-${id}: check-in offset ${offset} initial ${initial}`, () => fixture({ offsetMinutes: offset, status: initial }, (f) => {
      call('RECEPTION', `/appointments/${f.appointmentId}/checkin`, 'PATCH').its('status').should('eq', expected);
      call('ADMIN', `/appointments/${f.appointmentId}`).then(({ body }) => {
        expect(body.data.status).eq(expected === 200 ? 'Đã đến' : initial);
        if (expected === 200) {
          expect(body.data.checkInTime).to.be.a('string');
          note({ actualCheckInOffsetMs: new Date(body.data.checkInTime) - new Date(f.appointment.startTime),
            timingScope: 'Real HTTP clock; not a frozen exact-instant test' });
        }
      });
    }));
  }
  it('TC-APPT-016: UI check-in changes scheduled to arrived', () => fixture({ offsetMinutes: 0 }, (f) => {
    cy.login('reception'); cy.get('[data-testid="nav-reception"]').click();
    cy.intercept('PATCH', `**/api/appointments/${f.appointmentId}/checkin`).as('arrive');
    cy.get(`[data-testid="apt-row-${f.appointmentId}"]`).contains('button', 'Check-in').click();
    cy.wait('@arrive').its('response.statusCode').should('eq', 200);
    cy.get(`[data-testid="apt-row-${f.appointmentId}"]`).should('contain.text', 'Đã đến');
    stored(f, 'Đã đến'); shot('TC-APPT-016-arrived');
  }));
  for (const [id, initial, target, expected] of [['018', 'Đang điều trị', 'Đã hoàn thành', 200],
    ['019', 'Đã lên lịch', 'Đã hủy', 200], ['020', 'Đã đến', 'Đã hủy', 400], ['021', 'Đã hoàn thành', 'Đang điều trị', 400]]) {
    it(`TC-APPT-${id}: ${initial} to ${target} returns ${expected}`, () => fixture({ status: initial }, (f) => {
      call('ADMIN', `/appointments/${f.appointmentId}`, 'PATCH', { status: target }).its('status').should('eq', expected);
      stored(f, expected === 200 ? target : initial);
    }));
  }
  it('TC-APPT-022: repeated completion leaves exactly one invoice', () => fixture({ status: 'Đang điều trị' }, (f) => {
    call('ADMIN', `/appointments/${f.appointmentId}`, 'PATCH', { status: 'Đã hoàn thành' }).its('status').should('eq', 200);
    call('ADMIN', `/appointments/${f.appointmentId}`, 'PATCH', { status: 'Đã hoàn thành' }).then((r) => expect([200, 400, 409]).include(r.status));
    stored(f, 'Đã hoàn thành');
    call('ADMIN', `/invoices?appointmentId=${f.appointmentId}`).its('body.data').should('have.length', 1);
  }));
  it('TC-PAY-001: create invoice returns default unpaid state', () => fixture({ status: 'Đã hoàn thành' }, (f) => {
    call('RECEPTION', '/invoices', 'POST', { appointmentId: f.appointmentId, patientId: f.appointment.patientId,
      patientName: f.patientName, doctorId: f.appointment.doctorId, totalAmount: 100000, finalAmount: 100000 }).then((r) => {
      expect(r.status).eq(201); expect(r.body.data.status).eq('Chưa thanh toán');
      call('ADMIN', `/invoices/${r.body.data.id}`).then(({ body }) => expect(body.data.totalAmount).eq(100000));
    });
  }));
  it('TC-PAY-002: UI displays unpaid invoice patient amount and state', () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
    openInvoice(f);
    cy.get(`[data-testid="invoice-row-${f.invoiceId}"]`).should('contain.text', 'Chưa thanh toán');
    cy.contains(f.patientName).should('be.visible'); cy.contains('100.000').should('be.visible');
    call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => {
      expect(body.data.status).eq('Chưa thanh toán'); expect(body.data.totalAmount).eq(100000);
    });
    shot('TC-PAY-002-unpaid-invoice');
  }));
  it('TC-PAY-003: cash payment UI persists paid amount and zero debt', () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
    openInvoice(f); cy.get('[data-testid="payment-method"]').select('Tiền mặt');
    cy.intercept('PATCH', `**/api/invoices/${f.invoiceId}`).as('cash');
    cy.get('[data-testid="payment-confirm"]').click(); cy.wait('@cash').its('response.statusCode').should('eq', 200);
    cy.get(`[data-testid="invoice-row-${f.invoiceId}"]`).should('contain.text', 'Đã thanh toán');
    call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => {
      expect(body.data.status).eq('Đã thanh toán'); expect(body.data.amountPaid).eq(100000);
      expect(body.data.finalAmount).eq(100000); expect(body.data.debt).eq(0); expect(body.data.paymentMethod).eq('Tiền mặt');
    });
    shot('TC-PAY-003-cash-payment');
  }));
  for (const [id, method, paid, debt, expected] of [['004', 'Chuyển khoản', 100000, false, 200],
    ['005', 'Thẻ tín dụng', 100000, false, 200], ['006', 'Thẻ ATM', 100000, false, 200],
    ['007', 'Tiền mặt', 50000, false, 400], ['008', 'Tiền mặt', 40000, true, 200], ['010', 'Tiền mặt', -1, false, 400]]) {
    it(`TC-PAY-${id}: ${method} paid ${paid} debt ${debt}`, () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
      call('RECEPTION', `/invoices/${f.invoiceId}`, 'PATCH', { status: 'Đã thanh toán', paymentMethod: method,
        amountPaid: paid, finalAmount: 100000, allowDebt: debt }).its('status').should('eq', expected);
      call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => {
        expect(body.data.status).eq(expected === 200 ? 'Đã thanh toán' : 'Chưa thanh toán');
        expect(body.data.amountPaid).eq(expected === 200 ? paid : 0);
        expect(body.data.debt).eq(expected === 200 ? 100000 - paid : 0);
        expect(body.data.paymentMethod).eq(expected === 200 ? method : 'Tiền mặt');
      });
    }));
  }
  it('TC-PAY-012: full percentage discount UI persists zero final amount', () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
    openInvoice(f); cy.get('[data-testid="payment-discount-type"]').select('PERCENT');
    cy.get('[data-testid="payment-discount"]').type('{selectall}100').should('have.value', '100');
    note({ enteredDiscountType: 'PERCENT', enteredDiscount: 100, extraCharge: 0 });
    cy.intercept('PATCH', `**/api/invoices/${f.invoiceId}`).as('free');
    cy.get('[data-testid="payment-confirm"]').click(); cy.wait('@free').its('response.statusCode').should('eq', 200);
    call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => {
      expect(body.data.finalAmount).eq(0); expect(body.data.amountPaid).eq(0); expect(body.data.status).eq('Đã thanh toán');
    });
    shot('TC-PAY-012-full-discount');
  }));
  for (const id of ['016', '017']) {
    it(`TC-PAY-${id}: invalid ${id === '016' ? 'negative surcharge' : 'excessive discount'} is rejected by UI`, () => fixture({ invoice: true, status: 'Đã hoàn thành' }, (f) => {
      openInvoice(f); let writes = 0;
      cy.intercept('PATCH', `**/api/invoices/${f.invoiceId}`, () => { writes++; });
      const input = id === '016' ? '-1' : '100001';
      cy.get(`[data-testid="${id === '016' ? 'payment-extra-charge' : 'payment-discount'}"]`).type('{selectall}' + input).should('have.value', input);
      note({ enteredField: id === '016' ? 'extraCharge' : 'discount', enteredValue: Number(input) });
      cy.get('[data-testid="payment-confirm"]').click();
      if (id === '017') cy.contains('Giảm giá không được vượt quá tổng tiền!').should('be.visible');
      // A GET after submit records actual persistence even if a bad mutation was sent.
      call('ADMIN', `/invoices/${f.invoiceId}`).then(({ body }) => {
        return note({ invalidPaymentRequests: writes, ...safe(body) }).then(() => shot(`TC-PAY-${id}-actual-result`)).then(() => {
          expect(writes, 'invalid payment requests must not be sent').eq(0);
          expect(body.data.status).eq('Chưa thanh toán'); expect(body.data.amountPaid).eq(0);
        });
      });
    }));
  }
});
