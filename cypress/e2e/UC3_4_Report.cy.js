describe('UC3.4 - Thống kê doanh thu', () => {
  beforeEach(() => {
    // Admin đăng nhập
    cy.visit('/login')
    cy.get('#username').type('admin')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
  })

  it('TC_Report_001: Lọc báo cáo doanh thu theo khoảng thời gian', () => {
    cy.visit('/reports/revenue')
    
    // Chọn ngày bắt đầu và kết thúc
    cy.get('#date-start').type('2026-05-01')
    cy.get('#date-end').type('2026-05-31')
    
    // Nhấn Lọc
    cy.get('#btn-filter').click()
    
    // Chờ API trả kết quả và kiểm tra biểu đồ render
    cy.get('.loading-spinner').should('not.exist')
    cy.get('#revenue-chart').should('be.visible')
    cy.get('#total-revenue').should('not.be.empty')
  })

  it('TC_Report_002: Lỗi chọn ngày bắt đầu lớn hơn ngày kết thúc', () => {
    cy.visit('/reports/revenue')
    
    // Start Date > End Date
    cy.get('#date-start').type('2026-05-31')
    cy.get('#date-end').type('2026-05-01')
    cy.get('#btn-filter').click()
    
    // Kiểm tra hiển thị thông báo lỗi
    cy.get('.error-msg').should('contain', 'Ngày bắt đầu không thể lớn hơn ngày kết thúc')
    // Biểu đồ không xuất hiện
    cy.get('#revenue-chart').should('not.exist')
  })

  it('TC_Report_003: Xuất báo cáo ra file Excel', () => {
    cy.visit('/reports/revenue')
    
    // Giả sử dữ liệu đã được lọc sẵn
    // Intercept API download (nếu có) để kiểm tra
    
    cy.get('#btn-export-excel').click()
    
    // Cypress không dễ check file download trực tiếp từ thư mục OS một cách đơn giản, 
    // Nhưng có thể check file tồn tại trong thư mục cypress/downloads
    cy.readFile('cypress/downloads/Revenue_Report.xlsx', { timeout: 10000 }).should('exist')
  })
})
