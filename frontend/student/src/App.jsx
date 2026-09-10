import { useState, useEffect, useRef } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import '../style.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'waiting' | 'done' | 'official'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for Search, Modals, Chat selection
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null); // for signature modal
  const [selectedChatId, setSelectedChatId] = useState('dormtrack'); // 'dormtrack' is the ONLY ONE with confirm button
  const [mobileOpenChatId, setMobileOpenChatId] = useState(null); // for Mobile screen opening a chat
  const [showBanner, setShowBanner] = useState(true);
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'mobile' | 'desktop'
  
  const sigCanvas = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(320);

  // Responsive signature canvas sizing
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (canvasContainerRef.current) {
        const w = canvasContainerRef.current.clientWidth;
        if (w > 0) {
          setCanvasWidth(Math.max(260, Math.min(w - 24, 420)));
        }
      }
    };

    if (selectedPackage) {
      setTimeout(updateCanvasWidth, 60);
    }

    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, [selectedPackage]);

  useEffect(() => {
    // Fetch from backend
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/student/dashboard/123');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setDashboardData(data);
        setLoading(false);
      } catch (error) {
        console.warn('Backend not running or error fetching data, using mock data instead:', error);
        
        // Fallback mock data so UI can be viewed without running the backend
        setDashboardData({
          student: {
            name: 'สมชาย ดีใจ',
            profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'
          },
          packages: [
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
          ],
          notifications: [
            { time: 'เมื่อ 2 นาทีที่แล้ว', message: 'พัสดุใหม่ของคุณเลขที่ TH12345678 จัดส่งสำเร็จที่ห้องพัสดุตึก B แล้ว กรุณามาเซ็นรับ' },
            { time: 'เมื่อวานนี้ 09:16', message: 'พัสดุเลขที่ TH98765432 มาถึงที่หอพักแล้ว' }
          ],
          announcements: [
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
          ]
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1e1e1e', color: '#fff' }}>กำลังเปิด LINE...</div>;
  }

  if (!dashboardData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1e1e1e', color: '#fff' }}>ไม่สามารถโหลดข้อมูลได้</div>;
  }

  const { student, packages, notifications, announcements } = dashboardData;

  const handleSign = () => {
    if (sigCanvas.current.isEmpty()) {
      alert("กรุณาเซ็นชื่อก่อนยืนยันรับพัสดุ");
      return;
    }
    
    // Update package status to 'รับแล้ว'
    const updatedPackages = packages.map(p => 
      p.id === selectedPackage.id ? { ...p, status: 'รับแล้ว' } : p
    );
    setDashboardData({ ...dashboardData, packages: updatedPackages });
    setSelectedPackage(null);
  };

  const waitingCount = packages.filter(p => p.status === 'รอรับ').length;

  // The package displayed in DormTrack Connect official notification
  const primaryWaitingPackage = packages.find(p => p.status === 'รอรับ') || packages[0];

  // CHATS DEFINITION: Only 'dormtrack' has hasConfirmButton = true!
  const allChats = [
    {
      id: 'dormtrack',
      name: 'DormTrack Connect',
      avatarIcon: '📦',
      isOfficial: true,
      hasConfirmButton: true, // << THE ONLY CHAT THAT HAS THE CONFIRM BUTTON!
      time: '15:42 น.',
      lastMsg: waitingCount > 0 
        ? `แจ้งเตือนพัสดุใหม่ ${primaryWaitingPackage?.id} รอเซ็นรับ...` 
        : 'พัสดุทั้งหมดได้รับการเซ็นรับเรียบร้อยแล้ว',
      unreadCount: waitingCount,
    },
    {
      id: 'mom',
      name: 'คุณแม่ สมศรี',
      avatarImg: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
      isOfficial: false,
      hasConfirmButton: false,
      time: '09:22 น.',
      lastMsg: 'ส่งผลไม้ไปให้แล้วนะลูก ถึงหอหรือยังจ๊ะ',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: 'สมชาย แม่ส่งผลไม้กับขนมไปให้แล้วนะลูก ถึงหอหรือยังจ๊ะ? 🍇🍊', time: '09:15 น.' },
        { sender: 'me', text: 'ของมาถึงห้องพัสดุหอพักแล้วครับแม่ เดี๋ยวเย็นนี้แวะไปรับครับ ขอบคุณครับ ❤️', time: '09:20 น.' },
        { sender: 'other', text: 'จ้า พักผ่อนเยอะๆ นะลูก ตั้งใจเรียนนะ 🌟', time: '09:22 น.' },
      ]
    },
    {
      id: 'shopee_shop',
      name: 'ร้าน ABC Shop (Shopee)',
      avatarImg: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80',
      isOfficial: false,
      hasConfirmButton: false,
      time: '14:30 น.',
      lastMsg: 'ขอบคุณที่สั่งซื้อสินค้า ได้รับของแล้วฝากรีวิว 5 ดาวด้วยนะคะ',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: 'สวัสดีค่ะคุณลูกค้า ทางร้านจัดส่งพัสดุให้แล้วนะคะ เลขพัสดุ TH12345678 ขนส่งแจ้งว่าถึงปลายทางแล้วค่ะ 📦', time: '14:28 น.' },
        { sender: 'me', text: 'รับทราบครับผม', time: '14:29 น.' },
        { sender: 'other', text: 'ขอบคุณที่สั่งซื้อสินค้ากับทางร้าน ได้รับของแล้วฝากรีวิว 5 ดาวให้ร้านด้วยนะคะ ⭐⭐⭐⭐⭐', time: '14:30 น.' },
      ]
    },
    {
      id: 'dorm_office',
      name: 'หอพักนักศึกษา มทร.ล้านนา (131)',
      avatarIcon: '🏢',
      isOfficial: true,
      hasConfirmButton: false,
      time: '14:26 น.',
      lastMsg: 'แม่บ้าน: วันนี้มีเจ้าหน้าที่เข้ามาตรวจเช็คระบบ...',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: 'ประกาศ: พรุ่งนี้จะมีเจ้าหน้าที่เข้ามาตรวจเช็คระบบอินเทอร์เน็ตประจำตึก B เวลา 09:00 - 12:00 น.', time: '14:20 น.' },
        { sender: 'other', text: 'ห้องพัสดุเปิดทำการทุกวันจันทร์ - เสาร์ 08:30 - 18:00 น. กรุณานำบัตรนักศึกษามาติดต่อรับของด้วยนะคะ 🏢', time: '14:26 น.' },
      ]
    },
    {
      id: 'ee_dept',
      name: 'Dept. of EE. RMUTL (1,681)',
      avatarIcon: '🎓',
      isOfficial: false,
      hasConfirmButton: false,
      time: '15:19 น.',
      lastMsg: 'อาจารย์: แจ้งเลื่อนคลาสเรียนเป็นสัปดาห์หน้า...',
      unreadCount: 1,
      messages: [
        { sender: 'other', text: 'อาจารย์: แจ้งนักศึกษาทุกคน สัปดาห์หน้าจะมีการส่งรายงานความคืบหน้ารอบที่ 1 ตรวจสอบกำหนดการใน MS Teams ด้วยครับ', time: '15:19 น.' },
      ]
    },
    {
      id: 'line_stickers',
      name: 'LINE STICKERS',
      avatarIcon: '🛍️',
      isOfficial: true,
      hasConfirmButton: false,
      time: '12:00 น.',
      lastMsg: '✨ใหม่! สติกเกอร์ลูกหมี ขอบคุณน้องๆ...',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: '✨ใหม่! สติกเกอร์ลูกหมีขอบคุณน้องๆ ดาวน์โหลดได้แล้ววันนี้ที่ Sticker Shop 🐻', time: '12:00 น.' },
      ]
    },
  ];

  // Filter chats by search or tab
  const filteredChats = allChats.filter(chat => {
    if (activeTab === 'waiting' && chat.id !== 'dormtrack') return false;
    if (activeTab === 'done' && (chat.id !== 'dormtrack' || waitingCount > 0)) return false;
    if (activeTab === 'official' && !chat.isOfficial) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return chat.name.toLowerCase().includes(q) || chat.lastMsg.toLowerCase().includes(q);
    }
    return true;
  });

  // Current active chat on Desktop
  const currentDesktopChat = allChats.find(c => c.id === selectedChatId) || allChats[0];

  // Current active chat on Mobile
  const currentMobileChat = allChats.find(c => c.id === mobileOpenChatId) || null;

  return (
    <div className={`app-root mode-${viewMode}`}>
      {/* ========================================================= */}
      {/* RESPONSIVE SWITCHER BAR (แถบช่วยสลับโหมดทดสอบด้านบน) */}
      {/* ========================================================= */}
      <div className="responsive-switcher-bar">
        <div className="switcher-content">
          <span className="switcher-label">มุมมอง UI:</span>
          <div className="switcher-buttons">
            <button 
              className={`switch-btn ${viewMode === 'auto' ? 'active' : ''}`} 
              onClick={() => setViewMode('auto')}
            >
              🔄 ปรับอัตโนมัติ (Responsive)
            </button>
            <button 
              className={`switch-btn ${viewMode === 'desktop' ? 'active' : ''}`} 
              onClick={() => setViewMode('desktop')}
            >
              💻 LINE Desktop (PC)
            </button>
            <button 
              className={`switch-btn ${viewMode === 'mobile' ? 'active' : ''}`} 
              onClick={() => setViewMode('mobile')}
            >
              📱 LINE Mobile
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LINE DESKTOP (PC VERSION) - เหมือนรูปตัวอย่าง media_1789030719313 */}
      {/* ========================================================= */}
      <div className="line-pc-app desktop-only">
        
        {/* COLUMN 1: LEFT ICON SIDEBAR (แถบไอคอนซ้ายสุด 64px) */}
        <aside className="line-pc-sidebar">
          <div className="sidebar-top">
            <div className="user-avatar-wrap" title={student?.name || 'สมชาย ดีใจ'}>
              <img src={student?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="user-avatar" />
              <span className="online-indicator"></span>
            </div>
            
            <button className="sidebar-btn active" title="แชท (Chats)">
              <span className="sidebar-icon">💬</span>
              {waitingCount > 0 && <span className="sidebar-badge">{waitingCount}</span>}
            </button>
            
            <button className="sidebar-btn" title="เพื่อน (Friends)">
              <span className="sidebar-icon">👥</span>
            </button>

            <button className="sidebar-btn" title="VOOM">
              <span className="sidebar-icon">🧭</span>
            </button>

            <button className="sidebar-btn" title="LINE Call">
              <span className="sidebar-icon">📞</span>
            </button>
            
            <button className="sidebar-btn" title="Keep / บันทึก">
              <span className="sidebar-icon">📁</span>
            </button>
          </div>

          <div className="sidebar-bottom">
            <button className="sidebar-btn" title="การแจ้งเตือน">
              <span className="sidebar-icon">🔔</span>
            </button>
            <button className="sidebar-btn" title="ตั้งค่า (Settings)">
              <span className="sidebar-icon">⚙️</span>
            </button>
          </div>
        </aside>

        {/* COLUMN 2: MIDDLE CHATS LIST (~320px) */}
        <section className="line-pc-chatlist">
          {/* Top Filter Tabs */}
          <div className="pc-chatlist-tabs">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>ทั้งหมด</button>
            <button className={activeTab === 'waiting' ? 'active' : ''} onClick={() => setActiveTab('waiting')}>
              รอรับ {waitingCount > 0 && `(${waitingCount})`}
            </button>
            <button className={activeTab === 'done' ? 'active' : ''} onClick={() => setActiveTab('done')}>รับแล้ว</button>
            <button className={activeTab === 'official' ? 'active' : ''} onClick={() => setActiveTab('official')}>บัญชีทางการ</button>
            <button className="tab-settings-icon" title="ตัวกรอง">☰</button>
          </div>

          {/* Search Bar */}
          <div className="pc-search-wrap">
            <div className="pc-search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="ค้นหาข้อความและห้องแชท" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="sort-icon" title="จัดเรียง">⇅</span>
            </div>
          </div>

          {/* Chat Items List */}
          <div className="pc-chat-items-scroll">
            {filteredChats.map((chat) => (
              <div 
                className={`pc-chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <div className="chat-avatar-wrap">
                  {chat.avatarImg ? (
                    <img src={chat.avatarImg} alt={chat.name} className="pc-avatar" />
                  ) : (
                    <div className={`pc-avatar ${chat.id === 'dormtrack' ? 'official-bot' : 'neutral-icon'}`}>
                      {chat.avatarIcon}
                    </div>
                  )}
                  {chat.isOfficial && <span className="pc-check-badge">✓</span>}
                  {chat.id === 'dormtrack' && waitingCount > 0 && <span className="pc-green-dot"></span>}
                </div>
                
                <div className="chat-item-info">
                  <div className="chat-item-header">
                    <span className="chat-name">{chat.name}</span>
                    <span className="chat-time">{chat.time}</span>
                  </div>
                  <div className="chat-item-desc">
                    <p className="last-msg">{chat.lastMsg}</p>
                    {chat.unreadCount > 0 ? (
                      <span className="pc-unread-badge">{chat.unreadCount}</span>
                    ) : chat.id === 'dormtrack' && waitingCount === 0 ? (
                      <span className="pc-done-check">✓</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {filteredChats.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#777', fontSize: '12px' }}>
                ไม่พบห้องแชทที่ค้นหา
              </div>
            )}
          </div>

          {/* Floating new chat button */}
          <button className="pc-floating-btn" title="สร้างการแจ้งเตือนใหม่">
            💬+
          </button>

          {/* Bottom Ad / Promotion Banner */}
          <div className="pc-bottom-promo">
            <div className="promo-text">
              <small>LINE Official Account</small>
              <p>ระบบแจ้งเตือนพัสดุหอพัก อัตโนมัติ 24 ชม.</p>
            </div>
            <span className="promo-tag">Dorm</span>
          </div>
        </section>

        {/* COLUMN 3: RIGHT CHAT CONVERSATION AREA */}
        <section className="line-pc-chatroom">
          {/* Top Chatroom Header */}
          <div className="pc-chatroom-header">
            <div className="chatroom-header-left">
              {currentDesktopChat.isOfficial && <span className="header-verified-icon">✓</span>}
              <h2>{currentDesktopChat.name}</h2>
              {currentDesktopChat.isOfficial && <span className="header-megaphone" title="ประกาศ">📢</span>}
            </div>
            
            <div className="chatroom-header-right">
              <button className="header-tool-btn" title="ค้นหาในแชท">🔍</button>
              <button className="header-tool-btn" title="โทรเสียง">📞</button>
              <button className="header-tool-btn" title="ปักหมุด">📌</button>
              <button className="header-tool-btn" title="เมนู">☰</button>
              <div className="window-controls">
                <button className="win-btn" title="ย่อ">−</button>
                <button className="win-btn" title="ขยาย">□</button>
                <button className="win-btn win-close" title="ปิด">×</button>
              </div>
            </div>
          </div>

          {/* Chat Messages Timeline */}
          <div className="pc-chatroom-body">
            
            {/* ============================================================= */}
            {/* CASE 1: DORMTRACK CONNECT - CHAT เดียวที่มีปุ่มกดยืนยันสินค้า!   */}
            {/* ============================================================= */}
            {currentDesktopChat.hasConfirmButton ? (
              <>
                {/* Top Promotion / Rich Banner Card */}
                <div className="pc-rich-banner">
                  <div className="rich-banner-col banner-blue">
                    <div className="banner-badge">Dorm Track</div>
                    <h3>รับพัสดุได้เร็ว <span>สะดวก ปลอดภัย</span></h3>
                    <button className="banner-sub-btn">รายละเอียด</button>
                  </div>
                  <div className="rich-banner-col banner-pink">
                    <div className="banner-badge">ห้องพัสดุตึก B</div>
                    <h3>เปิดบริการ <span>08:30 - 18:00</span> น.</h3>
                    <button className="banner-sub-btn">ตารางเวลา</button>
                  </div>
                </div>
                <div className="pc-time-divider">12:26 น.</div>

                {/* Official Slip Notification Bubble (มีปุ่มยืนยันรับพัสดุ) */}
                <div className="pc-msg-bubble-wrap">
                  <div className="pc-sender-avatar">📦</div>
                  
                  <div className="pc-bubble-column">
                    <div className="pc-official-card">
                      <div className="pc-card-header">
                        <div className="header-main-status">
                          <span className="card-label">แจ้งเตือนพัสดุ</span>
                          <h3 className={`status-title ${primaryWaitingPackage.status === 'รอรับ' ? 'text-orange' : 'text-green'}`}>
                            {primaryWaitingPackage.status === 'รอรับ' ? 'รอเซ็นรับพัสดุ' : 'รับพัสดุแล้ว'}
                          </h3>
                        </div>
                        <span className="card-dorm-logo">📦</span>
                      </div>

                      <div className="pc-card-divider"></div>

                      {/* รูปพัสดุด้านบนของประเภท */}
                      {primaryWaitingPackage.image && (
                        <div className="pc-card-pkg-img-wrap">
                          <img src={primaryWaitingPackage.image} alt="พัสดุ" className="pc-card-pkg-img" />
                        </div>
                      )}

                      <div className="pc-card-table">
                        <div className="table-row">
                          <span className="row-label">ประเภท</span>
                          <span className="row-value">พัสดุลงทะเบียน / กล่องพัสดุ</span>
                        </div>
                        <div className="table-row">
                          <span className="row-label">เลขพัสดุ</span>
                          <span className="row-value bold-code">{primaryWaitingPackage.id}</span>
                        </div>
                        <div className="table-row">
                          <span className="row-label">จากผู้ส่ง</span>
                          <span className="row-value">{primaryWaitingPackage.sender}</span>
                        </div>
                        <div className="table-row">
                          <span className="row-label">ไปยัง</span>
                          <span className="row-value">{student?.name || 'สมชาย ดีใจ'} (ห้อง 302 ตึก S21)</span>
                        </div>
                        <div className="table-row">
                          <span className="row-label">จุดรับพัสดุ</span>
                          <span className="row-value">ห้องพัสดุกลาง ตึก B</span>
                        </div>
                        <div className="table-row">
                          <span className="row-label">วันที่ทำรายการ</span>
                          <span className="row-value">{primaryWaitingPackage.arrivedAt}</span>
                        </div>
                      </div>

                      {/* ACTION BUTTON INSIDE CARD - THE ONLY CHAT THAT HAS THIS! */}
                      <div className="pc-card-actions">
                        {primaryWaitingPackage.status === 'รอรับ' ? (
                          <button 
                            className="pc-sign-btn"
                            onClick={() => setSelectedPackage(primaryWaitingPackage)}
                          >
                            ✍️ ยืนยันรับพัสดุ (เซ็นรับของ)
                          </button>
                        ) : (
                          <div className="pc-signed-badge">
                            ✓ เซ็นรับพัสดุเรียบร้อยแล้ว
                          </div>
                        )}
                      </div>

                    </div>

                    <span className="bubble-timestamp">12.51 น.</span>
                  </div>
                </div>

                {/* User Reply Bubble (ถ้าเซ็นรับแล้ว) */}
                {primaryWaitingPackage.status === 'รับแล้ว' && (
                  <div className="pc-user-reply-wrap">
                    <span className="user-reply-time">15:42 น.</span>
                    <div className="pc-user-green-bubble">
                      ยืนยันการรับพัสดุ {primaryWaitingPackage.id} เรียบร้อยแล้วครับ ✅
                    </div>
                  </div>
                )}

                {/* Rich Menu Cards */}
                <div className="pc-rich-menu-section">
                  <div className="rich-menu-item">
                    <div className="rich-menu-thumb">📦</div>
                    <div className="rich-menu-text">
                      <h4>เช็คสถานะพัสดุ</h4>
                      <small>DormTrack Express</small>
                    </div>
                  </div>
                  
                  <div className="rich-menu-item">
                    <div className="rich-menu-thumb">🏢</div>
                    <div className="rich-menu-text">
                      <h4>ระเบียบห้องพัสดุ</h4>
                      <small>ข้อกำหนด & เวลาเปิดปิด</small>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* ============================================================= */
              /* CASE 2: CHAT อื่นๆ ทั้งหมด - เป็นแชทพูดคุยทั่วไป ไม่มีปุ่มยืนยัน! */
              /* ============================================================= */
              <div className="pc-normal-chat-timeline">
                <div className="pc-time-divider">วันนี้</div>
                
                {currentDesktopChat.messages && currentDesktopChat.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`pc-chat-msg-row ${m.sender === 'me' ? 'my-msg' : ''}`}
                  >
                    {m.sender !== 'me' && (
                      <div className="pc-normal-sender-avatar">
                        {currentDesktopChat.avatarImg ? (
                          <img src={currentDesktopChat.avatarImg} alt="avatar" />
                        ) : (
                          <span>{currentDesktopChat.avatarIcon}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="pc-msg-bubble">
                      {m.text}
                    </div>
                    
                    <div className="pc-msg-meta">
                      <span>{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Chatroom Footer Input Bar */}
          <div className="pc-chatroom-footer">
            <div className="footer-toolbar">
              <button className="tool-icon" title="ไฟล์แนบ">📎</button>
              <button className="tool-icon" title="สติกเกอร์">😀</button>
              <button className="tool-icon" title="จับภาพหน้าจอ">✂️</button>
              <button className="tool-icon" title="ส่งรูป">🖼️</button>
            </div>
            
            <div className="footer-input-area">
              <textarea placeholder="พิมพ์ข้อความ..."></textarea>
              <button className="pc-send-btn">ส่ง</button>
            </div>
          </div>

        </section>

      </div>

      {/* ========================================================= */}
      {/* MOBILE VIEW: LINE CHATS DASHBOARD                         */}
      {/* ========================================================= */}
      <div className="line-mobile-wrapper mobile-only">
        <div className="line-dashboard-mobile">
          
          {/* LINE Chats Top Header */}
          <div className="line-chats-header">
            <div className="line-chats-title">
              <h1>Chats</h1>
              <span className="line-dropdown-arrow">▾</span>
            </div>
            <div className="line-chats-actions">
              <button className="line-action-icon" title="Filter/Sort" onClick={() => setActiveTab(activeTab === 'waiting' ? 'all' : 'waiting')}>
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="6" x2="20" y2="6"/>
                  <line x1="4" y1="12" x2="14" y2="12"/>
                  <line x1="4" y1="18" x2="9" y2="18"/>
                  <polyline points="15 15 18 18 22 14"/>
                </svg>
              </button>
              <button className="line-action-icon" title="Camera">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 7l-7 5 7 5V7z"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
              </button>
              <button className="line-action-icon" title="New message">
                <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="8" x2="12" y2="14"/>
                  <line x1="9" y1="11" x2="15" y2="11"/>
                </svg>
              </button>
            </div>
          </div>

          {/* LINE Search Box */}
          <div className="line-search-wrap">
            <div className="line-search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="qr-scan-icon" title="QR Scanner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                  <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                  <rect x="7" y="7" width="3" height="3"/>
                  <rect x="14" y="7" width="3" height="3"/>
                  <rect x="7" y="14" width="3" height="3"/>
                  <rect x="14" y="14" width="3" height="3"/>
                </svg>
              </span>
            </div>
          </div>

          {/* LINE Announcement Banner Card */}
          {showBanner && announcements.length > 0 && (
            <div className="line-banner-card">
              <div className="line-banner-text">
                <h4>{announcements[0].title}</h4>
                <p>{announcements[0].date} · ห้องพัสดุหอพัก</p>
                <span className="banner-sub">Dorm Announcement</span>
              </div>
              <img src={announcements[0].image} alt="Announcement" className="line-banner-img" />
              <button className="line-banner-close" onClick={() => setShowBanner(false)}>×</button>
            </div>
          )}

          {/* Quick Filter Tabs */}
          <div className="line-quick-tabs">
            <button 
              className={activeTab === 'all' ? 'line-tab-btn active' : 'line-tab-btn'} 
              onClick={() => setActiveTab('all')}
            >
              แชททั้งหมด ({allChats.length})
            </button>
            <button 
              className={activeTab === 'waiting' ? 'line-tab-btn active' : 'line-tab-btn'} 
              onClick={() => setActiveTab('waiting')}
            >
              รอรับของ ({waitingCount})
            </button>
            <button 
              className={activeTab === 'official' ? 'line-tab-btn active' : 'line-tab-btn'} 
              onClick={() => setActiveTab('official')}
            >
              บัญชีทางการ
            </button>
          </div>

          {/* LINE Chat Rows List */}
          <div className="line-chat-list">
            {filteredChats.map((chat) => (
              <div 
                className="line-chat-item" 
                key={chat.id}
                onClick={() => setMobileOpenChatId(chat.id)}
              >
                <div className="line-avatar-wrap">
                  {chat.avatarImg ? (
                    <img src={chat.avatarImg} alt={chat.name} className="line-chat-avatar" />
                  ) : (
                    <div className={`line-chat-avatar ${chat.id === 'dormtrack' ? 'official-avatar' : 'neutral-avatar'}`}>
                      {chat.avatarIcon}
                    </div>
                  )}
                  {chat.isOfficial && <span className="official-check-dot">✓</span>}
                  {chat.id === 'dormtrack' && waitingCount > 0 && <span className="line-online-dot"></span>}
                </div>
                
                <div className="line-chat-main">
                  <div className="line-chat-top-row">
                    <span className="line-chat-sender">{chat.name}</span>
                    <span className="line-chat-time">{chat.time}</span>
                  </div>
                  
                  <div className="line-chat-bottom-row">
                    <p className="line-chat-preview">{chat.lastMsg}</p>
                    {chat.unreadCount > 0 ? (
                      <span className="line-unread-badge">{chat.unreadCount}</span>
                    ) : chat.id === 'dormtrack' && waitingCount === 0 ? (
                      <span className="line-done-check">✓</span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* LINE Style Bottom Navigation Bar */}
          <nav className="line-bottom-nav">
            <button className="line-nav-tab" onClick={() => { setActiveTab('all'); setSearchQuery(''); }}>
              <span className="line-nav-icon">🏠</span>
              <span className="line-nav-label">Home</span>
            </button>
            <button className="line-nav-tab active" onClick={() => { setActiveTab('all'); }}>
              <div className="icon-with-badge">
                <span className="line-nav-icon">💬</span>
                {waitingCount > 0 && <span className="nav-badge">{waitingCount}</span>}
              </div>
              <span className="line-nav-label">Chats</span>
            </button>
            <button className="line-nav-tab" onClick={() => setActiveTab('waiting')}>
              <span className="line-nav-icon">🧭</span>
              <span className="line-nav-label">VOOM</span>
            </button>
            <button className="line-nav-tab">
              <span className="line-nav-icon">👛</span>
              <span className="line-nav-label">Wallet</span>
            </button>
          </nav>

        </div>
      </div>

      {/* ================================================================= */}
      {/* MOBILE ONLY: CHAT ROOM OVERLAY                                    */}
      {/* ================================================================= */}
      {currentMobileChat && (
        <div className="line-chat-overlay mobile-only" onClick={() => setMobileOpenChatId(null)}>
          <div className="line-chat-container" onClick={(e) => e.stopPropagation()}>
            
            <div className="line-header">
              <button className="line-back-btn" onClick={() => setMobileOpenChatId(null)}>
                ‹
              </button>
              <div className="line-profile-info">
                <div className="line-header-title">
                  <span className="line-name">{currentMobileChat.name}</span>
                  {currentMobileChat.isOfficial && <span className="line-verified-badge">✓</span>}
                </div>
                <span className="line-header-status">{currentMobileChat.isOfficial ? 'Official Account' : 'Friend'}</span>
              </div>
              
              <div className="line-header-actions">
                <button className="line-icon-btn">🔍</button>
                <button className="line-icon-btn">📞</button>
                <button className="line-icon-btn">☰</button>
              </div>
            </div>

            <div className="line-chat-body">
              {/* If DormTrack Connect: Show the Official Card with the Confirm Button! */}
              {currentMobileChat.hasConfirmButton ? (
                <>
                  <div className="line-date-divider">
                    <span>{primaryWaitingPackage.arrivedAt.split(' ')[0]} {primaryWaitingPackage.arrivedAt.split(' ')[1]}</span>
                  </div>

                  <div className="line-msg-row">
                    <div className="line-avatar">📦</div>
                    
                    <div className="line-msg-content">
                      <span className="line-sender-name">DormTrack Connect</span>
                      
                      <div className="line-card-bubble">
                        <div className="line-card-header">
                          <div className="line-card-title-group">
                            <span className="line-card-icon">📬</span>
                            <h4>แจ้งเตือนพัสดุ</h4>
                          </div>
                          <span className={`line-card-status-badge ${primaryWaitingPackage.status === 'รอรับ' ? 'status-waiting' : 'status-done'}`}>
                            {primaryWaitingPackage.status === 'รอรับ' ? 'รอเซ็นรับพัสดุ' : 'รับพัสดุแล้ว'}
                          </span>
                        </div>

                        <div className="line-card-divider"></div>

                        {/* รูปพัสดุด้านบนของประเภท */}
                        {primaryWaitingPackage.image && (
                          <div className="line-card-pkg-img-wrap">
                            <img src={primaryWaitingPackage.image} alt="พัสดุ" className="line-card-pkg-img" />
                          </div>
                        )}

                        <div className="line-card-body">
                          <div className="line-info-row">
                            <span className="label">ประเภท</span>
                            <span className="value">พัสดุลงทะเบียน / กล่องพัสดุ</span>
                          </div>
                          <div className="line-info-row">
                            <span className="label">เลขพัสดุ</span>
                            <span className="value highlight">{primaryWaitingPackage.id}</span>
                          </div>
                          <div className="line-info-row">
                            <span className="label">จากผู้ส่ง</span>
                            <span className="value">{primaryWaitingPackage.sender}</span>
                          </div>
                          <div className="line-info-row">
                            <span className="label">ผู้รับ</span>
                            <span className="value">{student?.name || 'สมชาย ดีใจ'} (ห้อง 302 ตึก S21)</span>
                          </div>
                          <div className="line-info-row">
                            <span className="label">จุดรับพัสดุ</span>
                            <span className="value">ห้องพัสดุตึก B</span>
                          </div>
                          <div className="line-info-row">
                            <span className="label">เวลาที่มาถึง</span>
                            <span className="value">{primaryWaitingPackage.arrivedAt}</span>
                          </div>
                        </div>

                        {/* CONFIRM BUTTON INSIDE CARD - THE ONLY CHAT THAT HAS THIS! */}
                        <div className="line-card-actions">
                          {primaryWaitingPackage.status === 'รอรับ' ? (
                            <button 
                              className="line-sign-btn"
                              onClick={() => setSelectedPackage(primaryWaitingPackage)}
                            >
                              <span className="btn-icon">✍️</span> ยืนยันรับพัสดุ (เซ็นรับของ)
                            </button>
                          ) : (
                            <div className="line-signed-badge">
                              <span className="check-icon">✓</span> เซ็นรับพัสดุเรียบร้อยแล้ว
                            </div>
                          )}
                        </div>
                      </div>

                      <span className="line-msg-time">
                        {primaryWaitingPackage.arrivedAt.split(' ').slice(-1)[0]} น.
                      </span>
                    </div>
                  </div>

                  {primaryWaitingPackage.status === 'รับแล้ว' && (
                    <div className="line-msg-row line-msg-system">
                      <div className="line-avatar">📦</div>
                      <div className="line-msg-content">
                        <span className="line-sender-name">DormTrack Connect</span>
                        <div className="line-text-bubble">
                          นักศึกษาได้เซ็นรับพัสดุ <b>{primaryWaitingPackage.id}</b> เรียบร้อยแล้ว ขอบคุณที่มาติดต่อรับพัสดุครับ 📦✨
                        </div>
                        <span className="line-msg-time">เมื่อสักครู่</span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Regular Chat Messages for Other Chats - NO CONFIRM BUTTON! */
                <div className="line-normal-chat-body">
                  <div className="line-date-divider"><span>วันนี้</span></div>
                  {currentMobileChat.messages && currentMobileChat.messages.map((m, idx) => (
                    <div key={idx} className={`line-normal-msg-row ${m.sender === 'me' ? 'my-msg' : ''}`}>
                      <div className="line-normal-bubble">
                        {m.text}
                      </div>
                      <span className="line-normal-time">{m.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="line-chat-footer">
              <button className="line-footer-icon-btn">+</button>
              <button className="line-footer-icon-btn">📷</button>
              <button className="line-footer-icon-btn">🖼️</button>
              <div className="line-input-mock">
                <span>พิมพ์ข้อความ...</span>
              </div>
              <button className="line-footer-icon-btn">🎤</button>
            </div>

          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SIGNATURE MODAL (หน้าจอเซ็นรับแบบดิจิทัล)                           */}
      {/* ================================================================= */}
      {selectedPackage && (
        <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <button className="modal-close" onClick={() => setSelectedPackage(null)}>←</button>
              <h2>เซ็นรับพัสดุ</h2>
              <div style={{width: '24px'}}></div>
            </div>

            <div className="modal-body">
              <div className="modal-pkg-card">
                <img src={selectedPackage.image} className="modal-pkg-img" alt="Package" />
                <div className="modal-pkg-details">
                  <h4>{selectedPackage.id}</h4>
                  <p>{selectedPackage.sender} · {selectedPackage.arrivedAt.split(' ')[0]}</p>
                </div>
              </div>
              
              <div className="sig-main-card">
                <h3>ลงลายเซ็นดิจิทัล</h3>
                <p className="sig-subtitle">กรุณาเซ็นชื่อในกรอบด้านล่าง</p>
                
                <div className="sig-canvas-container" ref={canvasContainerRef}>
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: canvasWidth, height: 180, className: 'sigCanvas' }} 
                  />
                </div>

                <div className="modal-actions-group">
                  <button className="btn-primary full-width orange-btn" onClick={handleSign}>ยืนยันการรับพัสดุ</button>
                  <button className="btn-dark full-width" onClick={() => sigCanvas.current.clear()}>ล้างหน้าจอ</button>
                </div>
              </div>

              <p className="legal-text">
                เซ็นรับแบบอิเล็กทรอนิกส์ยืนยันตนถูกต้องตาม พ.ร.บ.
              </p>
            </div>
            
          </div>
        </div>
      )}
    </div>
  )
}
