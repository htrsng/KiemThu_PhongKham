describe('UC4 (4-5): Lập phiếu lương và Báo cáo tháng', () => {
  beforeEach(() => {
    cy.visit('/login')
    cy.get('#username').type('admin01')
    cy.get('#password').type('Pass@123')
    cy.get('#btn-login').click()
    cy.url().should('include', '/dashboard')
  })

  it('UC4.4: Lập phiếu lương cho một bác sĩ trong 1 tháng và Kiểm chứng CÔNG THỨC tính lương ca trực', () => {
    cy.visit('/doctor-payroll')
    
    // Chọn tháng và chọn bác sĩ (VD: Thạc sỹ - Hệ số 1.5)
    cy.get('#select-month').select('05/2026')
    cy.get('#select-doctor').select('BS. Nguyễn Văn A (Thạc sỹ)')
    cy.get('#btn-generate-payroll').click()

    // Chờ Modal Chi tiết lương xuất hiện
    cy.get('.payroll-detail-modal').should('be.visible')

    // Lấy Mức tiền một giờ (VD: từ cấu hình hệ thống đã thiết lập ở UC4.1)
    // Giả định mức lương 1 giờ hiển thị trên phiếu là 100,000 VND
    cy.get('#display-basic-wage').invoke('text').then((wageText) => {
      const soTienMotGio = parseFloat(wageText.replace(/,/g, '')) // Lấy số 100000
      
      // Lấy Hệ số bác sĩ (Ví dụ Thạc sỹ là 1.5)
      cy.get('#display-doctor-coef').invoke('text').then((coefText) => {
        const heSoBacSi = parseFloat(coefText) // 1.5
        
        // Kiểm tra logic toán học cho Ca làm việc đầu tiên trong bảng
        cy.get('table.shift-details tbody tr').first().within(() => {
          cy.get('.col-duration').invoke('text').then((durationText) => {
            const soGioMoiCa = parseFloat(durationText) // VD: 4 giờ
            
            cy.get('.col-shift-coef').invoke('text').then((shiftCoefText) => {
              const heSoCaLamViec = parseFloat(shiftCoefText) // VD: 1.0 (Giờ hành chính)
              
              cy.get('.col-patient-coef').invoke('text').then((patientCoefText) => {
                const tongHeSoBenhNhan = parseFloat(patientCoefText) // VD: 0.2 (Có 1 ca khó hệ số 0.2)
                
                // Áp dụng công thức quy đổi: Số_giờ_quy_đổi = Số_giờ_mỗi_ca * (Hệ_số_ca_làm_viêc + Tổng_hệ_số_bệnh_nhân)
                const soGioQuyDoi = soGioMoiCa * (heSoCaLamViec + tongHeSoBenhNhan)
                
                // Áp dụng công thức tính tiền làm thêm 1 ca
                const expectedTienLamThemCa = soGioQuyDoi * heSoBacSi * soTienMotGio
                
                // Trích xuất số tiền thực tế hiển thị trên UI để so sánh
                cy.get('.col-shift-payout').invoke('text').then((payoutText) => {
                  const actualTienLamThemCa = parseFloat(payoutText.replace(/[,. VND]/g, ''))
                  
                  // Kiểm chứng (Assert) kết quả tính toán có khớp với UI hiển thị không
                  expect(actualTienLamThemCa).to.equal(expectedTienLamThemCa)
                })
              })
            })
          })
        })
      })
    })

    // Sau khi kiểm chứng xong, tiến hành thao tác chốt lương
    cy.get('#btn-lock-payroll').click()
    cy.on('window:confirm', () => true) // Chấp nhận confirm browser
    cy.get('.toast-success').should('contain', 'Chốt phiếu lương thành công')
  })

  it('UC4.5: Báo cáo tiền lương tất cả bác sĩ trong 1 tháng', () => {
    cy.visit('/payroll-report-monthly')
    
    // Chọn tháng xem báo cáo
    cy.get('#filter-month').type('2026-05')
    cy.get('#btn-view-report').click()
    
    // Kiểm tra hiển thị danh sách các bác sĩ và tổng tiền
    cy.get('.report-table').should('be.visible')
    cy.get('.report-table tbody tr').should('have.length.greaterThan', 0) // Có ít nhất 1 dòng
    
    // Kiểm tra tổng quỹ lương cuối bảng
    cy.get('#total-fund-amount').should('not.be.empty')
  })
})
