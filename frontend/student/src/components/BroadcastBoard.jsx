import React from 'react'

/**
 * ChatTimelineFilterBar: แถบปุ่มสลับกรองดูพัสดุในห้องแชท (ทั้งหมด / พัสดุของฉัน / ประกาศ Broadcast)
 */
export function ChatTimelineFilterBar({ 
  filter, 
  setFilter, 
  myCount, 
  broadcastCount 
}) {
  return (
    <div className="chat-timeline-filter-bar">
      <button 
        type="button"
        className={`timeline-filter-pill ${filter === 'all' ? 'active' : ''}`}
        onClick={() => setFilter('all')}
        title="แสดงข้อความทั้งหมดทั้งพัสดุส่วนตัวและประกาศพัสดุไม่ทราบชื่อ"
      >
        💬 ทั้งหมด <span className="pill-count-badge">{myCount + broadcastCount}</span>
      </button>

      <button 
        type="button"
        className={`timeline-filter-pill ${filter === 'personal' ? 'active' : ''}`}
        onClick={() => setFilter('personal')}
        title="แสดงเฉพาะพัสดุส่วนตัวของคุณ"
      >
        📦 พัสดุของฉัน <span className="pill-count-badge">{myCount}</span>
      </button>

      <button 
        type="button"
        className={`timeline-filter-pill broadcast-pill ${filter === 'broadcast' ? 'active' : ''}`}
        onClick={() => setFilter('broadcast')}
        title="แสดงเฉพาะประกาศพัสดุที่ไม่ทราบชื่อ"
      >
        📢 ประกาศหาเจ้าของ (ไม่ทราบชื่อ) <span className="pill-count-badge" style={{ background: '#ea580c', color: '#fff' }}>{broadcastCount}</span>
      </button>
    </div>
  );
}

/**
 * BroadcastChatCard: การ์ดข้อความประกาศพัสดุไม่ทราบชื่อในห้องแชท (สไตล์ LINE Rich Message)
 */
export function BroadcastChatCard({ bpkg, currentStudent, onClaim, isMobile }) {
  const isMyClaim = bpkg.claimedBy && currentStudent && bpkg.claimedBy.includes(currentStudent.student_id || currentStudent.id);

  return (
    <div className="broadcast-chat-message-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
      <div className={isMobile ? "line-date-divider-clean" : "pc-time-divider"}>
        <span>📢 บรอดแคสต์ประกาศหาเจ้าของพัสดุ · {bpkg.broadcastAt}</span>
      </div>

      <div className={isMobile ? "line-msg-row-official" : "pc-msg-bubble-wrap"}>
        {isMobile ? (
          <div className="line-official-avatar-col">
            <div className="line-official-avatar-bubble">
              <span className="kbank-brand-icon">📢</span>
              <span className="kbank-sub" style={{ color: '#ea580c' }}>BC</span>
            </div>
          </div>
        ) : (
          <div className="pc-sender-avatar-official">
            <span className="kbank-brand-icon">📢</span>
            <span className="kbank-sub" style={{ color: '#ea580c' }}>BC</span>
          </div>
        )}

        <div className={isMobile ? "line-msg-content-official" : "pc-bubble-column"}>
          {/* WHITE CARD BUBBLE */}
          <div className={`line-white-card-bubble ${!isMobile ? 'pc-white-card-override' : ''}`} style={{ border: '1.5px solid #fed7aa' }}>
            <div className="card-top-header">
              <div className="card-brand-title">
                <span className="card-pkg-icon">📢</span>
                <h4 style={{ color: '#c2410c' }}>ประกาศพัสดุไม่ทราบชื่อ</h4>
              </div>
              <span className={`line-card-status-badge status-${bpkg.status}`}>
                {bpkg.status === 'broadcasted' && '🔴 ยังไม่มีเจ้าของ'}
                {bpkg.status === 'claimed' && '🟡 รอตรวจสอบ'}
                {bpkg.status === 'matched' && '🟢 ยืนยันแล้ว'}
              </span>
            </div>

            <div className="card-inner-divider"></div>

            {/* รูปพัสดุบนกล่อง */}
            {bpkg.photoUrl && (
              <div className="card-pkg-image-box" style={{ position: 'relative' }}>
                <img src={bpkg.photoUrl} alt="พัสดุไม่ทราบชื่อ" />
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  left: '6px',
                  background: 'rgba(0,0,0,0.75)',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px'
                }}>
                  {bpkg.carrier}
                </span>
              </div>
            )}

            <div className="card-details-table">
              <div className="card-detail-line">
                <span className="label">ประเภท</span>
                <span className="val" style={{ color: '#ea580c' }}>พัสดุไม่ทราบชื่อ / ประกาศหาเจ้าของ</span>
              </div>
              <div className="card-detail-line">
                <span className="label">เลขพัสดุ</span>
                <span className="val tracking-code">{bpkg.tracking}</span>
              </div>
              <div className="card-detail-line">
                <span className="label">ขนส่ง</span>
                <span className="val">{bpkg.carrier}</span>
              </div>
              <div className="card-detail-line">
                <span className="label">จ่าหน้าบนกล่อง</span>
                <span className="val" style={{ fontWeight: 700, color: '#111827' }}>{bpkg.recipientOnBox}</span>
              </div>
              <div className="card-detail-line">
                <span className="label">จุดที่พบ</span>
                <span className="val">{bpkg.foundLocation}</span>
              </div>
              <div className="card-detail-line">
                <span className="label">หมายเหตุหอพัก</span>
                <span className="val" style={{ color: '#d97706', fontSize: '11px', textAlign: 'right' }}>
                  {bpkg.staffNote}
                </span>
              </div>
              <div className="card-detail-line">
                <span className="label">เวลาที่ประกาศ</span>
                <span className="val">{bpkg.broadcastAt}</span>
              </div>
            </div>

            {/* Action Button: 🙋 แจ้งเป็นเจ้าของพัสดุนี้ */}
            <div className="card-action-container">
              {bpkg.status === 'broadcasted' ? (
                <button 
                  type="button" 
                  className="line-official-green-btn"
                  style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)' }}
                  onClick={() => onClaim(bpkg)}
                >
                  🙋 แจ้งเป็นเจ้าของพัสดุนี้
                </button>
              ) : bpkg.status === 'claimed' ? (
                <div className="line-official-signed-state" style={{ background: '#fffbeb', color: '#b45309', borderColor: '#fde68a' }}>
                  ⏳ {isMyClaim
                    ? 'คุณได้แจ้งสิทธิ์แล้ว (รอเจ้าหน้าที่ตรวจสอบ)'
                    : `มีผู้แจ้งสิทธิ์แล้ว (${bpkg.claimedBy})`}
                </div>
              ) : (
                <div className="line-official-signed-state">
                  <span className="check-mark">✓</span> ตรวจสอบและส่งมอบให้เจ้าของแล้ว
                </div>
              )}
            </div>
          </div>

          <span className={isMobile ? "line-msg-time-clean" : "bubble-timestamp"}>
            {bpkg.broadcastAt?.includes('น.') ? bpkg.broadcastAt.split(' ').slice(-2).join(' ') : 'เมื่อสักครู่'}
          </span>
        </div>
      </div>

      {/* Messages when claimed by current student */}
      {isMyClaim && (
        <>
          <div className={isMobile ? "line-normal-msg-row my-msg" : "pc-user-reply-wrap"}>
            <span className={isMobile ? "line-normal-time" : "user-reply-time"}>เมื่อสักครู่</span>
            <div className={isMobile ? "line-normal-bubble" : "pc-user-green-bubble"} style={{ background: '#ea580c', color: '#ffffff' }}>
              🙋 ผมขอแจ้งเป็นเจ้าของพัสดุ {bpkg.tracking} ({bpkg.recipientOnBox}) ครับ<br/>
              <small style={{ opacity: 0.9 }}>หลักฐาน: {bpkg.claimProof || 'แนบรายละเอียดแล้ว'}</small>
            </div>
          </div>

          <div className={isMobile ? "line-msg-row-official" : "pc-msg-bubble-wrap"} style={{ marginTop: '4px' }}>
            {isMobile ? (
              <div className="line-official-avatar-col">
                <div className="line-official-avatar-bubble">
                  <span className="kbank-brand-icon">📦</span>
                  <span className="kbank-sub">DORM</span>
                </div>
              </div>
            ) : (
              <div className="pc-sender-avatar-official">
                <span className="kbank-brand-icon">📦</span>
                <span className="kbank-sub">DORM</span>
              </div>
            )}
            <div className={isMobile ? "line-msg-content-official" : "pc-bubble-column"}>
              <div className="line-text-dark-bubble" style={{ maxWidth: '320px' }}>
                เจ้าหน้าที่หอพักได้รับแจ้งสิทธิ์พัสดุ <b>{bpkg.tracking}</b> ของคุณเรียบร้อยแล้ว กำลังตรวจสอบหลักฐาน หากถูกต้องจะแจ้งให้มารับทันทีครับ 📋✨
              </div>
              <span className={isMobile ? "line-msg-time-clean" : "bubble-timestamp"}>เมื่อสักครู่</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * ClaimModal: หน้าต่างยืนยันการแจ้งสิทธิ์ความเป็นเจ้าของพัสดุที่ไม่ทราบชื่อ
 */
export function ClaimModal({ pkg, currentStudent, evidence, setEvidence, onClose, onSubmit }) {
  if (!pkg) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🙋 แจ้งเป็นเจ้าของพัสดุ</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="modal-pkg-card">
            <img 
              src={pkg.photoUrl || "https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=150&q=80"} 
              alt="Parcel" 
              className="modal-pkg-img" 
            />
            <div className="modal-pkg-details">
              <h4>Tracking: {pkg.tracking}</h4>
              <p>ขนส่ง: {pkg.carrier} | จ่าหน้า: {pkg.recipientOnBox}</p>
              <p style={{ color: '#fbbf24', marginTop: '2px' }}>{pkg.staffNote}</p>
            </div>
          </div>

          <div className="claim-form">
            <div className="claim-student-banner">
              <div style={{ marginBottom: '2px' }}>ข้อมูลผู้แจ้งสิทธิ์ (นักศึกษา):</div>
              <strong>👤 {currentStudent?.name} (รหัส {currentStudent?.student_id || currentStudent?.id})</strong>
              <div>🏠 {currentStudent?.room} | 📞 {currentStudent?.phone}</div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: '#d1d5db', marginBottom: '6px', fontWeight: 600 }}>
                ระบุหลักฐานยืนยันความเป็นเจ้าของ:
              </label>
              <textarea 
                className="claim-textarea"
                placeholder="เช่น เลข Order Shopee/Lazada, รายละเอียดสิ่งของภายในกล่อง, หรือเบอร์โทรศัพท์ที่สั่ง เพื่อให้เจ้าหน้าที่ตรวจสอบ..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                autoFocus
              />
            </div>

            <div className="modal-actions-group">
              <button 
                type="button" 
                className="full-width line-green-modal-btn"
                style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
                onClick={onSubmit}
              >
                ยืนยันการแจ้งเป็นเจ้าของพัสดุ
              </button>
              <button 
                type="button" 
                className="full-width btn-dark" 
                onClick={onClose}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fallback BroadcastBoardView (ถ้าต้องการเปิดเป็นมุมมองบอร์ด)
 */
export function BroadcastBoardView({ 
  packages, 
  onClaim, 
  searchQuery, 
  setSearchQuery, 
  statusFilter, 
  setStatusFilter, 
  currentStudent 
}) {
  return null;
}
