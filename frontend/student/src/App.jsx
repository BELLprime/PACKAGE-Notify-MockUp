import { useState } from 'react'
import '../style.css'

// Mock Data
const myPackages = [
  {
    id: 'TH12345678',
    sender: 'ร้าน ABC Shop (Shopee)',
    arrivedAt: '2 ก.ย. 2568 14:30',
    status: 'รอรับ',
    image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'TH98765432',
    sender: 'คุณแม่ สมศรี',
    arrivedAt: '1 ก.ย. 2568 09:15',
    status: 'รอรับ',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'
  },
  {
    id: 'TH55443322',
    sender: 'Lazada Mall Official',
    arrivedAt: '30 ส.ค. 2568 16:45',
    status: 'รับแล้ว',
    image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=150&q=80'
  }
];

const notifications = [
  { time: 'เมื่อ 2 นาทีที่แล้ว', message: 'พัสดุใหม่ของคุณเลขที่ TH12345678 จัดส่งสำเร็จที่ห้องพัสดุตึก B แล้ว กรุณามาเซ็นรับ' },
  { time: 'เมื่อวานนี้ 09:16', message: 'พัสดุเลขที่ TH98765432 มาถึงที่หอพักแล้ว' }
];

const announcements = [
  { 
    title: 'ซองพัสดุสีขาว จ่าหน้าไม่ชัดเจน', 
    date: 'พบเมื่อ: 1 ก.ย. - ตึก B',
    image: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=100&q=80'
  },
  { 
    title: 'กล่องรองเท้า Nike ตกหล่น', 
    date: 'พบเมื่อ: 28 ส.ค. - ตึก A',
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=100&q=80'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <>
      <header className="topbar">
        <a href="#" className="brand">
          <div className="logo-icon">📦</div>
          DormTrack <span>ระบบติดตามพัสดุ</span>
        </a>
        
        <nav>
          <button className="active">หน้าหลัก</button>
          <button>พัสดุของฉัน</button>
          <button>การแจ้งเตือน</button>
          <button>ประวัติ</button>
        </nav>
        
        <div className="topbar-actions">
          <button className="icon-btn">🔍</button>
          <button className="icon-btn">
            🔔
            <span className="badge-count">3</span>
          </button>
          
          <div className="profile-menu">
            <span>สมชาย ดีใจ</span>
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="Profile" />
          </div>
        </div>
      </header>

      <main>
        <div className="page-header">
          <h1>แดชบอร์ดนักศึกษา</h1>
          <div className="tabs">
            <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>ภาพรวม</button>
            <button className={activeTab === 'waiting' ? 'active' : ''} onClick={() => setActiveTab('waiting')}>รอรับพัสดุ</button>
            <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>ประวัติทั้งหมด</button>
          </div>
        </div>

        <div className="grid-layout">
          {/* Left Column - Package List */}
          <div className="left-col">
            <h2 className="section-title">พัสดุล่าสุดของคุณ</h2>
            
            {myPackages.map((pkg) => (
              <div className="package-card" key={pkg.id}>
                <img src={pkg.image} alt="Package" className="pkg-img" />
                <div className="pkg-info">
                  <h3>{pkg.id}</h3>
                  <p>ผู้ส่ง: {pkg.sender}</p>
                  <p>มาถึงเมื่อ: {pkg.arrivedAt}</p>
                </div>
                <div className="pkg-actions">
                  <span className={`badge-status ${pkg.status === 'รอรับ' ? 'badge-waiting' : 'badge-done'}`}>
                    {pkg.status}
                  </span>
                  {pkg.status === 'รอรับ' && (
                    <button className="btn-primary">ยืนยันรับพัสดุ</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Widgets */}
          <div className="right-col">
            <div className="stat-card">
              <div className="stat-icon orange">📦</div>
              <div className="stat-info">
                <p>พัสดุรอรับ</p>
                <h3>3 ชิ้น</h3>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon blue">✓</div>
              <div className="stat-info">
                <p>รับแล้วเดือนนี้</p>
                <h3>12 ชิ้น</h3>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon purple">📥</div>
              <div className="stat-info">
                <p>พัสดุสะสมทั้งหมด</p>
                <h3>47 ชิ้น</h3>
              </div>
            </div>

            <div className="notify-card">
              <h3><span>💬</span> การแจ้งเตือนล่าสุด (LINE Notify)</h3>
              {notifications.map((note, idx) => (
                <div className="timeline-item" key={idx}>
                  <small>{note.time}</small>
                  <p>{note.message}</p>
                </div>
              ))}
            </div>

            <div className="announce-card">
              <h3><span>⚠️</span> ประกาศพัสดุไร้เจ้าของ</h3>
              {announcements.map((ann, idx) => (
                <div className="announce-item" key={idx}>
                  <img src={ann.image} alt="Announcement item" />
                  <div className="announce-info">
                    <h4>{ann.title}</h4>
                    <p>{ann.date}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>
    </>
  )
}
