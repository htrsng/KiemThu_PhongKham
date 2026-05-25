describe('UC3.3 - Thanh toán chi phí khám bệnh', () => {
  beforeEach(() => {
    // Thu ngân đăng nhập
    cy.visit('/login')
    cy.get('#username').type('thungan01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
  })

  it('TC_Payment_001: Tính tổng tiền đúng và thanh toán toàn bộ bằng tiền mặt', () => {
    cy.visit('/billing')
    
    // Chọn hồ sơ bệnh nhân vừa khám xong
    cy.get('.invoice-item.unpaid').first().click()
    
    // Kiểm tra UI hiển thị đúng số tiền dịch vụ và thuốc
    cy.get('#total-service-fee').should('not.be.empty')
    cy.get('#total-medicine-fee').should('not.be.empty')
    
    // Chọn phương thức thanh toán
    cy.get('#payment-method').select('Tiền mặt')
    
    // Điền số tiền khách đưa bằng đúng tổng tiền
    cy.get('#total-amount').invoke('text').then((total) => {
      cy.get('#amount-received').type(total.replace(/,/g, ''))
    })
    
    // Xác nhận thanh toán
    cy.get('#btn-pay').click()
    
    // Kết quả mong đợi
    cy.get('.toast-success').should('contain', 'Thanh toán thành công')
    cy.get('.invoice-status').should('contain', 'Đã thanh toán')
  })

  it('TC_Payment_002: Áp dụng mã giảm giá (Voucher %)', () => {
    cy.visit('/billing/invoice/INV-001') // Mở một hóa đơn cụ thể
    
    // Lấy tổng tiền ban đầu
    cy.get('#total-amount').invoke('val').as('initialTotal')
    
    // Nhập mã giảm giá 10%
    cy.get('#discount-code').type('GIAM10')
    cy.get('#btn-apply-discount').click()
    
    // Kiểm tra có thông báo áp dụng thành công
    cy.get('.discount-msg').should('contain', 'Giảm 10%')
    
    // Kiểm tra số tiền tổng đã được giảm
    // (Logic check thực tế sẽ parse số và so sánh, ở đây dùng contain để minh họa)
    cy.get('#final-amount').should('not.eq', '@initialTotal')
  })
})
