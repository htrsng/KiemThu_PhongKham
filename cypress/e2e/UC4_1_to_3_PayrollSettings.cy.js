describe('UC4 (1-3): Cài đặt thông số tính lương', () => {
  beforeEach(() => {
    // Giả định đăng nhập bằng tài khoản Quản trị/Kế toán
    cy.visit('/login')
    cy.get('#username').type('admin01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
    cy.url().should('include', '/dashboard')
    
    // Điều hướng vào màn hình Cài đặt lương
    cy.visit('/payroll-settings')
  })

  it('UC4.1: Thiết lập mức tiền cơ bản cho một giờ thành công', () => {
    cy.get('#tab-basic-wage').click()
    
    // Xóa giá trị cũ và nhập giá trị mới (VD: 100,000 VND/giờ)
    cy.get('#input-basic-wage').clear().type('100000')
    cy.get('#btn-save-basic-wage').click()
    
    // Xác minh Toast message
    cy.get('.toast-success').should('contain', 'Cập nhật mức lương cơ bản thành công')
    
    // Xác minh giá trị hiển thị lại đúng
    cy.get('#input-basic-wage').should('have.value', '100,000') // giả định field format số
  })

  it('UC4.2: Thiết lập hệ số ca làm việc các ngày trong tuần', () => {
    cy.get('#tab-shift-coefficient').click()
    
    // Giả sử có bảng nhập hệ số cho các thứ trong tuần
    // Thiết lập hệ số T7, CN thành 1.5
    cy.get('#coef-saturday').clear().type('1.5')
    cy.get('#coef-sunday').clear().type('1.5')
    cy.get('#btn-save-shift-coef').click()
    
    cy.get('.toast-success').should('contain', 'Lưu hệ số ca làm việc thành công')
    cy.get('#coef-sunday').should('have.value', '1.5')
  })

  it('UC4.3: Nhập hệ số các ca cần xử lý phức tạp trong tháng', () => {
    cy.get('#tab-patient-coefficient').click()
    
    // Thêm một cấu hình hệ số khó mới
    cy.get('#btn-add-complex-case').click()
    
    // Nhập tên loại bệnh lý và hệ số
    cy.get('#input-complex-name').type('Nhổ răng khôn mọc lệch')
    cy.get('#input-complex-coef').clear().type('0.5')
    cy.get('#btn-save-complex').click()
    
    cy.get('.toast-success').should('contain', 'Lưu hệ số ca bệnh phức tạp thành công')
    
    // Kiểm tra trong danh sách hiển thị
    cy.get('.complex-case-list').should('contain', 'Nhổ răng khôn mọc lệch')
    cy.get('.complex-case-list').should('contain', '0.5')
  })
})
