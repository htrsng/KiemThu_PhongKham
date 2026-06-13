describe('UC4: Tính lương bác sĩ (Automated TCs)', () => {

  beforeEach(() => {
    // Visit the mock HTML page to simulate the system UI
    cy.visit('../dental-system/mock_salary.html');
  });

  // 1. Validation Test Cases
  it('TC_001: Kiểm tra Validation Tiền cơ bản với giá trị âm', () => {
    cy.get('[data-testid="input-base-salary"]').type('-10000');
    cy.get('[data-testid="btn-save-base-salary"]').click();
    cy.get('[data-testid="msg-base-salary"]').should('contain', 'Giá trị không hợp lệ');
  });

  it('TC_002: Kiểm tra Validation Hệ số ca làm việc với chuỗi rỗng', () => {
    cy.get('[data-testid="btn-save-shift"]').click();
    cy.get('[data-testid="msg-shift"]').should('contain', 'Giá trị không hợp lệ');
  });

  // 2. Boundary Test Cases
  it('TC_025: Thiết lập thành công mức tiền cơ bản hợp lệ lớn', () => {
    cy.get('[data-testid="input-base-salary"]').type('100000000');
    cy.get('[data-testid="btn-save-base-salary"]').click();
    cy.get('[data-testid="msg-base-salary"]').should('contain', 'Lưu thành công');
  });

  // 3. Functional Test Cases
  it('TC_045: Tính lương 1 ca: Bác sĩ Thạc sĩ, Ca Ngoài giờ, Bệnh nhân Rất phức tạp', () => {
    // Giả lập config: Học vị=1.5, Giờ=4, Bệnh nhân=0.5
    // Tính toán: Tiền = (4 * (1.0 + 0.5)) * 1.5 * 100000 = 6 * 1.5 * 100000 = 900000
    cy.get('[data-testid="input-doctor-coefficient"]').clear().type('1.5');
    cy.get('[data-testid="input-hours"]').clear().type('4');
    cy.get('[data-testid="input-patient-coefficient"]').clear().type('0.5');
    cy.get('[data-testid="btn-calculate"]').click();
    cy.get('[data-testid="result-salary"]').should('contain', 'Tiền = 900000');
  });
  
  it('TC_046: Tính lương 1 ca: Bác sĩ Đại học, Ca Hành chính, Bệnh nhân Thường', () => {
    // Học vị=1.3, Giờ=4, Bệnh nhân=0
    // Tính toán: Tiền = (4 * (1.0 + 0)) * 1.3 * 100000 = 4 * 1.3 * 100000 = 520000
    cy.get('[data-testid="input-doctor-coefficient"]').clear().type('1.3');
    cy.get('[data-testid="input-hours"]').clear().type('4');
    cy.get('[data-testid="input-patient-coefficient"]').clear().type('0');
    cy.get('[data-testid="btn-calculate"]').click();
    cy.get('[data-testid="result-salary"]').should('contain', 'Tiền = 520000');
  });

  // Simulating a failing test to demonstrate Cypress screenshot capability in the report
  it('TC_050: Kiểm tra lỗi hệ thống khi tính lương ca cực lớn (Fail Example)', () => {
    cy.get('[data-testid="input-doctor-coefficient"]').clear().type('9999');
    cy.get('[data-testid="input-hours"]').clear().type('9999');
    cy.get('[data-testid="btn-calculate"]').click();
    // This will intentionally fail because the mock system doesn't have an "Over limit" safeguard
    cy.get('[data-testid="result-salary"]').should('contain', 'Vượt quá hạn mức');
  });

});
