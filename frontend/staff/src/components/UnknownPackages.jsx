import { useState, useMemo } from 'react'
import { getStudentMatchStatus, mockStudents } from '../data/mockData'

export default function UnknownPackages({
  packages,
  onBroadcast,
  onBroadcastAll,
  onManualMatch,
  onEdit,
  onDelete
}) {
  const [matchModalTarget, setMatchModalTarget] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // กรองเฉพาะพัสดุที่ไม่ทราบชื่อ (ไม่ตรงกับฐานข้อมูลนักศึกษา)
  const unknownList = useMemo(() => {
    return packages
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !getStudentMatchStatus(item).matched)
      .filter(({ item }) => {
        if (!searchQuery.trim()) return true
        const q = searchQuery.trim().toLowerCase()
        return (
          item.tracking?.toLowerCase().includes(q) ||
          item.recipient?.toLowerCase().includes(q) ||
          item.note?.toLowerCase().includes(q)
        )
      })
  }, [packages, searchQuery])

  const broadcastedCount = unknownList.filter(({ item }) => item.isBroadcasted).length
  const pendingBroadcastCount = unknownList.filter(
    ({ item }) =>
      !item.isBroadcasted &&
      item.status !== 'รับแล้ว' &&
      item.status !== 'received' &&
      !item.claimedBy &&
      item.status !== 'claimed'
  ).length

  const handleOpenMatchModal = (item, index) => {
    setMatchModalTarget({ item, index })
    setSelectedStudentId('')
  }

  const handleConfirmMatch = () => {
    if (!selectedStudentId || !matchModalTarget) return
    const student = mockStudents.find(s => s.student_id === selectedStudentId)
    if (!student) return

    onManualMatch(matchModalTarget.index, student)
    setMatchModalTarget(null)
    setSelectedStudentId('')
  }

  return (
    <section className="page active-page">
      <div className="page-heading">
        <div>
          <h1>จัดการพัสดุที่ไม่ทราบชื่อ (Unknown Packages)</h1>
          <p>
            รายการพัสดุที่ตรวจสอบแล้วไม่พบในฐานข้อมูล หรือจ่าหน้าไม่ชัดเจน (สอดคล้องตามข้อกำหนด FR-01 และ FR-04)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {pendingBroadcastCount > 0 && (
            <button
              className="primary"
              type="button"
              onClick={onBroadcastAll}
              title="ส่ง Broadcast ประกาศหาเจ้าของพัสดุที่ไม่ทราบชื่อทั้งหมดไปยังบอร์ดนักศึกษา"
            >
              📢 Broadcast ทั้งหมด ({pendingBroadcastCount})
            </button>
          )}
        </div>
      </div>

      {/* แถบแจ้งเตือนเงื่อนไขข้อกำหนด FR-01 & FR-04 */}
      <div
        style={{
          background: '#fff9e6',
          border: '1px solid #ffe58f',
          padding: '14px 18px',
          borderRadius: 'var(--radius)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <span style={{ fontSize: '22px', lineHeight: 1 }}>📢</span>
        <div>
          <b style={{ color: '#d48806', fontSize: '13.5px' }}>ข้อกำหนดระบบ (FR-01 & FR-04)</b>
          <div style={{ color: 'var(--ink-secondary)', fontSize: '12.5px', marginTop: '3px' }}>
            เมื่อเจ้าหน้าที่บันทึกพัสดุและระบบตรวจไม่พบชื่อในฐานข้อมูล พัสดุจะถูกแยกมาไว้ที่หน้านี้โดยอัตโนมัติ 
            เจ้าหน้าที่สามารถกด <b>"Broadcast"</b> เพื่อนำรายการไปประกาศที่กระดานสาธารณะของนักศึกษา (Student Broadcast Board) 
            และเมื่อนักศึกษาติดต่อมา สามารถกด <b>"จับคู่นักศึกษา"</b> เพื่อเปลี่ยนสถานะกลับเป็นพัสดุปกติได้
          </div>
        </div>
      </div>

      {/* เครื่องมือค้นหาและสถิติย่อย */}
      <section className="mgmt-toolbar" style={{ marginBottom: '20px' }}>
        <div className="mgmt-search-row">
          <div className="search-field" style={{ flex: 1 }}>
            <label>🔍 ค้นหาพัสดุไม่ทราบชื่อ (เลขพัสดุ / ชื่อจ่าหน้ากล่อง)</label>
            <input
              type="text"
              placeholder="พิมพ์เลขพัสดุ หรือชื่อที่เขียนหน้ากล่อง..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <button
              className="secondary btn-sm clear-filter-btn"
              type="button"
              onClick={() => setSearchQuery('')}
            >
              ✕ ล้างค้นหา
            </button>
          )}
        </div>
      </section>

      {/* ตารางรายการพัสดุไม่ทราบชื่อ */}
      <section className="table-card">
        <div className="table-meta-bar">
          <h2>
            พัสดุที่ไม่ทราบชื่อทั้งหมด
            <span className="count-badge" style={{ background: '#fff1f0', color: '#cf1322' }}>
              {unknownList.length} ชิ้น
            </span>
          </h2>
          <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px' }}>
            <span style={{ color: '#389e0d' }}>✓ ประกาศ Broadcast แล้ว: <b>{broadcastedCount}</b></span>
            <span style={{ color: '#fa8c16' }}>⏳ รอประกาศ: <b>{pendingBroadcastCount}</b></span>
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>รูปถ่ายพัสดุ</th>
                <th>เลขพัสดุ</th>
                <th>ชื่อผู้รับ (หน้ากล่อง)</th>
                <th>สาเหตุที่ไม่ตรง</th>
                <th>สถานะ Broadcast</th>
                <th>วันที่รับเข้า</th>
                <th style={{ textAlign: 'center', minWidth: '220px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {unknownList.length ? (
                unknownList.map(({ item, index }) => {
                  const matchStatus = getStudentMatchStatus(item)
                  return (
                    <tr key={item.tracking + index}>
                      <td style={{ width: '70px', textAlign: 'center' }}>
                        {item.photoUrl ? (
                          <img
                            src={item.photoUrl}
                            alt="รูปพัสดุ"
                            style={{
                              width: '48px',
                              height: '48px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              border: '1px solid var(--line)'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              background: '#fff0e8',
                              borderRadius: '6px',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '20px'
                            }}
                          >
                            📦
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{item.tracking}</strong>
                      </td>
                      <td>
                        <b style={{ color: '#cf1322' }}>{item.recipient || '(ไม่ระบุชื่อ)'}</b>
                      </td>
                      <td style={{ maxWidth: '240px' }}>
                        <small style={{ color: 'var(--muted)', display: 'block' }}>
                          {item.note || matchStatus.reason || 'ไม่พบในฐานข้อมูลนักศึกษา'}
                        </small>
                      </td>
                      <td>
                        {item.status === 'รับแล้ว' || item.status === 'received' ? (
                          <span className="badge done">
                            ✅ รับพัสดุแล้ว
                          </span>
                        ) : item.claimedBy || item.status === 'claimed' ? (
                          <span className="badge" style={{ background: '#e6f7ff', color: '#096dd9', border: '1px solid #91d5ff' }}>
                            🙋 มีผู้แจ้งสิทธิ์แล้ว ({item.claimedBy})
                          </span>
                        ) : item.isBroadcasted ? (
                          <span className="badge verified" style={{ background: '#e6f7ff', color: '#096dd9' }}>
                            📢 ประกาศบนบอร์ดแล้ว
                          </span>
                        ) : (
                          <span className="badge warning">
                            ⏳ ยังไม่ประกาศ
                          </span>
                        )}
                      </td>
                      <td>{item.date}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="btn-actions" style={{ justifyContent: 'center' }}>
                          {/* ปุ่ม Broadcast (FR-04) - ป้องกันการกดซ้ำหากประกาศไปแล้ว หรือมีผู้รับ/แจ้งสิทธิ์แล้ว */}
                          {item.status === 'รับแล้ว' || item.status === 'received' ? (
                            <span style={{ fontSize: '12px', color: '#52c41a', fontWeight: 600, padding: '4px 8px' }}>
                              ✓ รับแล้ว
                            </span>
                          ) : item.claimedBy || item.status === 'claimed' ? (
                            <button
                              type="button"
                              className="btn-action"
                              disabled
                              style={{ background: '#f5f5f5', color: '#8c8c8c', border: '1px solid #d9d9d9', cursor: 'not-allowed' }}
                              title="มีนักศึกษาแจ้งสิทธิ์ความเป็นเจ้าของแล้ว ไม่สามารถประกาศซ้ำได้"
                            >
                              🙋 แจ้งสิทธิ์แล้ว
                            </button>
                          ) : item.isBroadcasted ? (
                            <button
                              type="button"
                              className="btn-action"
                              disabled
                              style={{ background: '#f5f5f5', color: '#8c8c8c', border: '1px solid #d9d9d9', cursor: 'not-allowed' }}
                              title="พัสดุนี้ได้ทำการประกาศ Broadcast ไปแล้ว ไม่สามารถกดซ้ำได้"
                            >
                              📢 ประกาศแล้ว
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-action"
                              style={{
                                background: '#e6f7ff',
                                color: '#096dd9',
                                border: '1px solid #91d5ff'
                              }}
                              title="ส่ง Broadcast ประกาศหาเจ้าของ"
                              onClick={() => onBroadcast(index)}
                            >
                              📢 Broadcast
                            </button>
                          )}

                          {/* ปุ่มจับคู่นักศึกษา (Manual Match) */}
                          <button
                            type="button"
                            className="btn-action"
                            style={{ background: '#f6ffed', color: '#389e0d', border: '1px solid #b7eb8f' }}
                            title="จับคู่พัสดุนี้กับนักศึกษาในระบบ"
                            onClick={() => handleOpenMatchModal(item, index)}
                          >
                            🔗 จับคู่ชื่อ
                          </button>

                          {/* ปุ่มแก้ไข */}
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            title="แก้ไขข้อมูลพัสดุ"
                            onClick={() => onEdit(item, index)}
                          >
                            ✏️
                          </button>

                          {/* ปุ่มลบ */}
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            title="ลบพัสดุนี้"
                            onClick={() => onDelete(item, index)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px 15px' }}>
                    <div style={{ color: 'var(--muted)' }}>
                      <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
                        🎉
                      </span>
                      <b>ยอดเยี่ยมมาก! ไม่มีพัสดุที่ไม่ทราบชื่อตกค้างในระบบ</b>
                      <p style={{ fontSize: '12px', margin: '4px 0 0' }}>
                        พัสดุทั้งหมดได้รับการตรวจสอบและตรงกับฐานข้อมูลนักศึกษาเรียบร้อยแล้ว
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal จับคู่นักศึกษาด้วยตนเอง (Manual Match Modal) */}
      {matchModalTarget && (
        <div className="modal-backdrop" onClick={() => setMatchModalTarget(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <h3>🔗 ระบุตัวตน / จับคู่นักศึกษา (Manual Match)</h3>
            <p>
              เลือกนักศึกษาที่เป็นเจ้าของพัสดุ <b>{matchModalTarget.item.tracking}</b> (จ่าหน้า: "{matchModalTarget.item.recipient}") 
              เพื่อย้ายพัสดุเข้าสู่รายการปกติ
            </p>

            <div style={{ margin: '16px 0' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                เลือกนักศึกษาจากฐานข้อมูลหอพัก:
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  font: 'inherit'
                }}
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- กรุณาเลือกนักศึกษา --</option>
                {mockStudents.map(student => (
                  <option key={student.student_id} value={student.student_id}>
                    {student.student_id} - {student.first_name} {student.last_name} (หอพักตึก {student.building} ห้อง {student.room_number})
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setMatchModalTarget(null)}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                className="primary"
                disabled={!selectedStudentId}
                onClick={handleConfirmMatch}
              >
                ✓ ยืนยันการจับคู่
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
