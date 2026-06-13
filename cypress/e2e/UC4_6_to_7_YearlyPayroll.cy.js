describe('UC4 (6-7): Báo cáo tiền lương năm', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('#username').type('admin01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
    cy.url().should('include', '/dashboard')
  })

  it('UC4.6: Báo cáo tiền lương của một bác sĩ trong một năm', () => {
    cy.visit('/doctor-yearly-report')
    
    // Chọn năm và chọn bác sĩ
    cy.get('#select-year').select('2026')
    cy.get('#select-doctor').select('BS. Nguyễn Văn A (Thạc sỹ)')
    cy.get('#btn-view-yearly-report').click()
    
    // Xác minh giao diện báo cáo hiện lên
    cy.get('.yearly-chart-container').should('be.visible')
    cy.get('.yearly-table-details').should('be.visible')
    
    // Kiểm tra bảng chi tiết hiển thị đủ 12 tháng (hoặc các tháng có dữ liệu)
    cy.get('.yearly-table-details tbody tr').should('have.length.at.least', 1)
    
    // Kiểm tra có cột Tổng Lương hiển thị
    cy.get('.col-total-salary-year').should('not.be.empty')
  })

  it('UC4.7: Báo cáo tiền lương tất cả bác sĩ trong 1 năm', () => {
    cy.visit('/clinic-yearly-report')
    
    // Chọn năm xem báo cáo
    cy.get('#select-year').select('2026')
    cy.get('#btn-view-report').click()
    
    // Xác minh bảng báo cáo hiển thị
    cy.get('.clinic-report-table').should('be.visible')
    
    // Kiểm tra danh sách hiển thị tất cả các bác sĩ
    cy.get('.clinic-report-table tbody tr').should('have.length.greaterThan', 1)
    
    // Kiểm tra số liệu quỹ lương tổng năm
    cy.get('#total-annual-fund').invoke('text').should('not.be.empty')
  })
})
