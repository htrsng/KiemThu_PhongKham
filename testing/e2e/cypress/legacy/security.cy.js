describe('Security Tests', () => {
  const sqlPayloads = ["' OR 1=1 --", "'; DROP TABLE users; --", '" OR "x"="x'];

  context('SQL Injection', () => {
    sqlPayloads.forEach(payload => {
      it(`SQL Injection: ${payload}`, () => {
        cy.visit('/login');
        cy.get('#username').clear().type(payload);
        cy.get('[name=password]').clear().type('test');
        cy.contains('button', 'Đăng nhập').click();
        
        // Xác nhận SQL Injection bị chặn đúng (status 200 redirect về /login, không phải lỗi 500)
        cy.url().should('include', '/login');
      });
    });
  });

  context('Phan quyen (IDOR)', () => {
    it('[TC-UC12-014] Bug#887: BS sua chuyen khoa dong nghiep khong bi chan', () => {
      cy.login('bac_si');
      cy.request({
        method: 'PUT',
        url: '/api/doctors/BS002/specialty', // ID cua BS khac
        body: { specialty: "Rang tre em" },
        failOnStatusCode: false
      }).then(res => {
        expect(res.status).to.equal(403);
      });
    });
  });
});
