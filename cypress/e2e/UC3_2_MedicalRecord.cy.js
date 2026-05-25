describe('UC3.2 - Khám bệnh và Cập nhật hồ sơ bệnh án', () => {
  beforeEach(() => {
    // Đăng nhập bằng tài khoản Bác sĩ
    cy.visit('/login')
    cy.get('#username').type('bacsi01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
  })

  it('TC_MedRecord_001: Cập nhật chẩn đoán và chỉ định dịch vụ', () => {
    // Mở hồ sơ bệnh nhân đầu tiên trong danh sách chờ
    cy.visit('/doctor/queue')
    cy.get('.btn-start-exam').first().click()
    
    // Chẩn đoán
    cy.get('#symptoms').type('Bệnh nhân đau răng cấm hàm dưới bên trái')
    cy.get('#diagnosis').type('Sâu răng mức độ 3, cần diệt tủy')
    
    // Thêm dịch vụ điều trị
    cy.get('#btn-add-service').click()
    cy.get('#service-dropdown').select('Diệt tủy răng')
    cy.get('#btn-confirm-service').click()
    
    // Kiểm tra dịch vụ đã được add vào bảng
    cy.get('#service-table').should('contain', 'Diệt tủy răng')
    cy.get('#service-table').should('contain', '500,000') // Giả định giá
  })

  it('TC_MedRecord_002: Kê đơn thuốc và lưu hồ sơ (Happy Path)', () => {
    // Tiếp tục từ màn hình đang khám (giả lập)
    cy.visit('/doctor/exam/P-123') 
    
    // Kê đơn thuốc
    cy.get('#btn-add-prescription').click()
    cy.get('#medicine-search').type('Paracetamol')
    cy.get('.autocomplete-item').first().click()
    cy.get('#quantity').type('10')
    cy.get('#dosage').type('Ngày uống 2 lần, mỗi lần 1 viên sau ăn')
    cy.get('#btn-save-medicine').click()
    
    // Hoàn tất khám
    cy.get('#btn-complete-exam').click()
    cy.get('.modal-confirm').should('be.visible')
    cy.get('#btn-yes-complete').click()
    
    // Kiểm tra trạng thái đã chuyển sang "Hoàn tất" và cấm chỉnh sửa
    cy.get('.toast-success').should('contain', 'Hoàn tất quá trình khám')
    cy.get('#symptoms').should('be.disabled') // Input bị khóa
  })
})
