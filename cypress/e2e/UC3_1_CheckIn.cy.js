describe('UC3.1 - Tiếp đón bệnh nhân (Check-in)', () => {
  beforeEach(() => {
    // Giả định quá trình đăng nhập bằng tài khoản Lễ tân
    cy.visit('/login')
    cy.get('#username').type('letan01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
    cy.url().should('include', '/dashboard')
  })

  it('TC_CheckIn_001: Bệnh nhân đã có lịch hẹn check-in thành công', () => {
    cy.visit('/reception') // Mở trang tiếp đón
    
    // Tìm kiếm bệnh nhân theo mã lịch hẹn hoặc tên
    cy.get('#search-patient').type('LH-00123')
    cy.get('#btn-search').click()
    
    // Xác minh thông tin hiển thị đúng
    cy.get('.patient-name').should('contain', 'Nguyễn Văn A')
    
    // Thực hiện thao tác check-in
    cy.get('#btn-checkin').click()
    
    // Kiểm tra UI có hiển thị popup xác nhận không
    cy.get('.modal-confirm').should('be.visible')
    cy.get('#btn-confirm-checkin').click()
    
    // Kết quả mong đợi: Trạng thái đổi thành "Đang chờ khám", hiển thị Toast success
    cy.get('.toast-success').should('contain', 'Check-in thành công')
    cy.get('.patient-status').should('contain', 'Đang chờ khám')
  })

  it('TC_CheckIn_002: Bệnh nhân walk-in (không có lịch hẹn) tạo hồ sơ mới', () => {
    cy.visit('/reception')
    
    // Click nút Thêm mới bệnh nhân
    cy.get('#btn-new-patient').click()
    
    // Điền form thông tin
    cy.get('#full-name').type('Trần Thị B')
    cy.get('#phone').type('0912345678')
    cy.get('#dob').type('1990-01-01')
    cy.get('#gender').select('Nữ')
    cy.get('#reason').type('Khám răng định kỳ')
    
    // Lưu và đưa vào hàng chờ
    cy.get('#btn-save-and-queue').click()
    
    // Kiểm tra hàng chờ được cập nhật
    cy.get('.toast-success').should('contain', 'Thêm vào hàng chờ thành công')
    cy.get('#queue-list').should('contain', 'Trần Thị B')
  })
})
