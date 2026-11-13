const apiUrl = () => Cypress.env('API_URL');

function apiLogin(email, password) {
  return cy.request('POST', `${apiUrl()}/auth/login`, { email, password })
    .then(({ body }) => body.token);
}

function authRequest(token, method, url, body) {
  return cy.request({
    method,
    url: `${apiUrl()}${url}`,
    headers: { Authorization: `Bearer ${token}` },
    body,
    failOnStatusCode: false,
  });
}

function createAppointment(token) {
  const now = new Date();
  const start = new Date(now.getTime() + 5 * 60 * 1000);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const date = start.toISOString().slice(0, 10);
  const hour = String(Math.max(0, start.getHours() - 1)).padStart(2, '0');
  const shift = {
    doctorId: Cypress.env('qaDoctorId'),
    doctorName: 'QA Doctor',
    date,
    startTime: `${hour}:00`,
    endTime: start.getHours() === 23
      ? '23:59'
      : `${String(start.getHours() + 2).padStart(2, '0')}:00`,
  };

  return authRequest(token, 'POST', '/patients', {
    patientCode: `QA-CY-${Date.now()}`,
    fullName: 'QA Cypress Patient',
    phone: `091${String(Date.now()).slice(-7)}`,
    dateOfBirth: '1990-01-01',
    gender: 'Khác',
    address: 'QA',
  }).then(({ body }) => {
    return authRequest(token, 'POST', '/shifts', shift).then(() => authRequest(
      token,
      'POST',
      '/appointments',
      {
        patientId: body.data.id,
        patientName: body.data.fullName,
        doctorId: Cypress.env('qaDoctorId'),
        doctorName: 'QA Doctor',
        serviceId: Cypress.env('qaServiceId'),
        serviceName: 'QA Consultation',
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'Đã lên lịch',
        difficulty: 0,
      },
    ));
  });
}

describe('Luồng chính và phân quyền — Cypress', () => {
  let adminToken;
  let doctorToken;
  let receptionToken;

  before(() => {
    expect(Cypress.env('DOCTOR_USER'), 'DOCTOR_USER đã được cấu hình').to.be.a('string').and.not.be.empty;
    expect(Cypress.env('RECEPTION_USER'), 'RECEPTION_USER đã được cấu hình').to.be.a('string').and.not.be.empty;

    return cy.then(() => apiLogin(Cypress.env('ADMIN_USER'), Cypress.env('ADMIN_PASS')))
      .then((token) => {
        adminToken = token;
        return authRequest(token, 'GET', '/doctors');
      })
      .then(({ body }) => {
        Cypress.env('qaDoctorId', body.data.find((doctor) => doctor.licenseNumber === 'QA-DOC-001').id);
        return authRequest(adminToken, 'GET', '/patients');
      })
      .then(({ body }) => {
        Cypress.env('qaPatientId', body.data.find((patient) => patient.patientCode === 'QA-PAT-001').id);
        return authRequest(adminToken, 'GET', '/services');
      })
      .then(({ body }) => {
        Cypress.env('qaServiceId', body.data.find((service) => service.code === 'QA-SRV-001').id);
        return apiLogin(Cypress.env('DOCTOR_USER'), Cypress.env('DOCTOR_PASS'));
      })
      .then((token) => {
        doctorToken = token;
        return apiLogin(Cypress.env('RECEPTION_USER'), Cypress.env('RECEPTION_PASS'));
      })
      .then((token) => {
        receptionToken = token;
      });
  });

  it('Admin sees dashboard after login', () => {
    cy.login('admin');
    cy.get('[data-testid="nav-dashboard"]').should('be.visible');
  });

  it('Admin sees account management navigation', () => {
    cy.login('admin');
    cy.get('[data-testid="nav-accounts"]').should('be.visible').click();
    cy.get('[data-testid="page-accounts"]').should('be.visible');
  });

  it('Doctor cannot see account management navigation', () => {
    cy.login('doctor');
    cy.get('[data-testid="nav-accounts"]').should('not.exist');
    cy.request({
      url: `${apiUrl()}/accounts`,
      headers: { Authorization: `Bearer ${doctorToken}` },
      failOnStatusCode: false,
    }).its('status').should('equal', 403);
  });

  it('Reception can see payment but not account management navigation', () => {
    cy.login('reception');
    cy.get('[data-testid="nav-payment"]').should('be.visible');
    cy.get('[data-testid="nav-accounts"]').should('not.exist');
  });

  it('Admin creates an appointment through the API and opens appointment UI', () => {
    createAppointment(adminToken).then((response) => {
      expect(response.status).to.equal(201);
      Cypress.env('qaAppointmentId', response.body.data.id);
    });
    cy.login('admin');
    cy.get('[data-testid="nav-appointments"]').click();
    cy.contains('Quản lý Lịch hẹn').should('be.visible');
  });

  it('Reception checks in the appointment', () => {
    authRequest(receptionToken, 'PATCH', `/appointments/${Cypress.env('qaAppointmentId')}/checkin`)
      .its('status').should('equal', 200);
  });

  it('Doctor sees the examination page', () => {
    cy.login('doctor');
    cy.get('[data-testid="nav-appointments"]').should('be.visible');
    cy.visit('/examination');
    cy.contains('Hàng đợi hôm nay').should('be.visible');
  });

  it('Doctor moves an appointment into treatment', () => {
    authRequest(doctorToken, 'PATCH', `/appointments/${Cypress.env('qaAppointmentId')}`, { status: 'Đang điều trị' })
      .its('status').should('equal', 200);
  });

  it('Doctor completes treatment and creates an invoice', () => {
    authRequest(doctorToken, 'PATCH', `/appointments/${Cypress.env('qaAppointmentId')}`, { status: 'Đã hoàn thành' })
      .its('status').should('equal', 200);
    authRequest(receptionToken, 'GET', '/invoices').then(({ body }) => {
      const invoice = body.data.find((item) => item.appointmentId === Cypress.env('qaAppointmentId'));
      expect(invoice, 'invoice created for completed appointment').to.exist;
      Cypress.env('qaInvoiceId', invoice.id);
    });
  });

  it('Reception opens payment UI with invoice list', () => {
    cy.login('reception');
    cy.get('[data-testid="nav-payment"]').click();
    cy.contains('Danh sách hóa đơn').should('be.visible');
  });

  it('Reception pays the invoice through the API', () => {
    authRequest(receptionToken, 'PATCH', `/invoices/${Cypress.env('qaInvoiceId')}`, {
      status: 'Đã thanh toán',
      amountPaid: 100000,
      finalAmount: 100000,
      paymentMethod: 'Tiền mặt',
    }).its('status').should('equal', 200);
  });

  it('Rejects an underpayment without debt approval', () => {
    authRequest(receptionToken, 'PATCH', `/invoices/${Cypress.env('qaInvoiceId')}`, {
      status: 'Đã thanh toán',
      amountPaid: 1,
      finalAmount: 100000,
      allowDebt: false,
    }).its('status').should('equal', 400);
  });

  it('Rejects an invalid token', () => {
    cy.request({
      url: `${apiUrl()}/auth/me`,
      headers: { Authorization: 'Bearer invalid-token' },
      failOnStatusCode: false,
    }).its('status').should('equal', 401);
  });
});
