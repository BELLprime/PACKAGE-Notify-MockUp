import logo from '../../../shared/rmutl-logo.png'

export default function Navbar({
  page,
  onGoDashboard,
  onGoPackages,
  onGoUnknown,
  onReset,
  unmatchedCount = 0
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="brand brand-button"
        onClick={() => onGoDashboard('all')}
        aria-label="กลับหน้าหลัก"
      >
        <div className="brand-icon">
          <img src={logo} alt="ตราสัญลักษณ์มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา" />
        </div>
        <div className="brand-text">
          <b>ระบบติดตามพัสดุหอพัก</b>
          <small>มหาวิทยาลัยเทคโนโลยีราชมงคลล้านนา</small>
        </div>
      </button>

      <nav className="nav-menu">
        <button
          type="button"
          className={page === 'dashboard' ? 'active' : ''}
          onClick={() => onGoDashboard('all')}
        >
          หน้าหลัก
        </button>
        <button
          type="button"
          className={page === 'packages' || page === 'package-form' ? 'active' : ''}
          onClick={onGoPackages}
        >
          จัดการพัสดุ
        </button>
        <button
          type="button"
          className={page === 'unknown' ? 'active' : ''}
          onClick={onGoUnknown}
          title="จัดการพัสดุที่ไม่ทราบชื่อ (FR-01, FR-04)"
        >
          ⚠️ พัสดุไม่ทราบชื่อ
          {unmatchedCount > 0 && <span className="nav-badge">{unmatchedCount}</span>}
        </button>
      </nav>

      <div className="profile-container" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onReset && (
          <button
            type="button"
            className="secondary btn-sm"
            onClick={onReset}
            style={{ fontSize: '11.5px', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
            title="รีเซ็ตข้อมูลพัสดุทั้งหมดกลับสู่ค่าเริ่มต้นสำหรับการทดสอบ"
          >
            🔄 รีเซ็ตเริ่มต้น
          </button>
        )}
        <button className="profile" type="button" aria-label="ข้อมูลผู้ใช้">
          <span className="avatar">ธ</span>
          <div className="profile-info">
            <b>ธรรมชาติ ดีใจ</b>
            <small>เจ้าหน้าที่หอพักชาย A</small>
          </div>
        </button>
      </div>
    </header>
  )
}
