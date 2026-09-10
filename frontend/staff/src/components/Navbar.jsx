import logo from '../../../shared/rmutl-logo.png'

export default function Navbar({ page, onGoDashboard, onGoPackages }) {
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
      </nav>

      <div className="profile-container">
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
