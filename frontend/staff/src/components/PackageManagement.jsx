import { useMemo, useState } from 'react'
import { getStudentMatchStatus } from '../data/mockData'

export default function PackageManagement({ packages, onNew, onEdit, onDelete }) {
  const [nameFilter, setNameFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [buildingFilter, setBuildingFilter] = useState('all')
  const [matchFilter, setMatchFilter] = useState('all') // 'all' | 'unmatched' | 'matched'

  const filteredPackages = useMemo(() => {
    return packages
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        // กรองเฉพาะชื่อผู้รับ (Filter specifically by recipient name)
        if (nameFilter.trim()) {
          const nameNeedle = nameFilter.trim().toLowerCase()
          if (!item.recipient?.toLowerCase().includes(nameNeedle)) {
            return false
          }
        }

        // ค้นหาทั่วไป (เลขพัสดุ, รหัสนักศึกษา, ห้อง, เบอร์โทร)
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase()
          const matchTracking = item.tracking?.toLowerCase().includes(q)
          const matchStudentId = item.studentId?.toLowerCase().includes(q)
          const matchRoom = item.room?.toLowerCase().includes(q)
          const matchPhone = item.phone?.toLowerCase().includes(q)
          if (!matchTracking && !matchStudentId && !matchRoom && !matchPhone) {
            return false
          }
        }

        // กรองสถานะ
        if (statusFilter !== 'all' && item.status !== statusFilter) {
          return false
        }

        // กรองตึก
        if (buildingFilter !== 'all' && item.building !== buildingFilter) {
          return false
        }

        // กรองการตรงกับฐานข้อมูล
        if (matchFilter === 'unmatched') {
          if (getStudentMatchStatus(item).matched) return false
        } else if (matchFilter === 'matched') {
          if (!getStudentMatchStatus(item).matched) return false
        }

        return true
      })
  }, [packages, nameFilter, searchQuery, statusFilter, buildingFilter, matchFilter])

  const hasActiveFilters = Boolean(
    nameFilter.trim() ||
      searchQuery.trim() ||
      statusFilter !== 'all' ||
      buildingFilter !== 'all' ||
      matchFilter !== 'all'
  )

  const clearFilters = () => {
    setNameFilter('')
    setSearchQuery('')
    setStatusFilter('all')
    setBuildingFilter('all')
    setMatchFilter('all')
  }

  const pendingCount = packages.filter(p => p.status === 'รอรับพัสดุ').length
  const receivedCount = packages.filter(p => p.status === 'รับแล้ว').length
  const unmatchedTotal = packages.filter(p => !getStudentMatchStatus(p).matched).length

  return (
    <section className="page active-page">
      <div className="page-heading">
        <div>
          <h1>จัดการรายการพัสดุ</h1>
          <p>รายการพัสดุทั้งหมดในระบบ สามารถค้นหา กรอง เพิ่ม แก้ไข และลบข้อมูลได้</p>
        </div>
        <button className="primary" onClick={onNew} type="button">
          ＋ เพิ่มพัสดุใหม่
        </button>
      </div>

      <section className="mgmt-toolbar">
        <div className="mgmt-search-row">
          <div className="search-field">
            <label>
              👤 กรองเฉพาะชื่อผู้รับ <span className="highlight-tag">เฉพาะชื่อ</span>
            </label>
            <input
              type="text"
              placeholder="พิมพ์ชื่อหรือนามสกุล เช่น สมชาย, มาริ..."
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
            />
          </div>

          <div className="search-field">
            <label>🔍 ค้นหาทั่วไป (เลขพัสดุ / รหัสนักศึกษา / ห้อง)</label>
            <input
              type="text"
              placeholder="เช่น PKG-2026, 650001, A-204..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button
              className="secondary btn-sm clear-filter-btn"
              type="button"
              onClick={clearFilters}
            >
              ✕ ล้างตัวกรอง
            </button>
          )}
        </div>

        <div className="mgmt-filter-row">
          <div className="filter-pill-group">
            <span className="filter-label">สถานะพัสดุ:</span>
            <button
              type="button"
              className={`filter ${statusFilter === 'all' ? 'selected' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              ทั้งหมด ({packages.length})
            </button>
            <button
              type="button"
              className={`filter ${statusFilter === 'รอรับพัสดุ' ? 'selected' : ''}`}
              onClick={() => setStatusFilter('รอรับพัสดุ')}
            >
              รอรับพัสดุ ({pendingCount})
            </button>
            <button
              type="button"
              className={`filter ${statusFilter === 'รับแล้ว' ? 'selected' : ''}`}
              onClick={() => setStatusFilter('รับแล้ว')}
            >
              พัสดุที่รับแล้วทั้งหมด ({receivedCount})
            </button>
          </div>

          <div className="filter-pill-group">
            <span className="filter-label">การตรวจฐานข้อมูล:</span>
            <button
              type="button"
              className={`filter ${matchFilter === 'all' ? 'selected' : ''}`}
              onClick={() => setMatchFilter('all')}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              className={`filter ${matchFilter === 'unmatched' ? 'selected' : ''}`}
              onClick={() => setMatchFilter('unmatched')}
              style={{ color: matchFilter === 'unmatched' ? undefined : '#cf1322' }}
            >
              ⚠️ ชื่อไม่ตรงฐานข้อมูล ({unmatchedTotal})
            </button>
          </div>

          <div className="filter-pill-group">
            <span className="filter-label">ตึกหอพัก:</span>
            <button
              type="button"
              className={`filter ${buildingFilter === 'all' ? 'selected' : ''}`}
              onClick={() => setBuildingFilter('all')}
            >
              ทุกตึก
            </button>
            <button
              type="button"
              className={`filter ${buildingFilter === 'A' ? 'selected' : ''}`}
              onClick={() => setBuildingFilter('A')}
            >
              หอพักชาย ตึก A
            </button>
            <button
              type="button"
              className={`filter ${buildingFilter === 'B' ? 'selected' : ''}`}
              onClick={() => setBuildingFilter('B')}
            >
              หอพักหญิง ตึก B
            </button>
          </div>
        </div>
      </section>

      <section className="table-card">
        <div className="table-meta-bar">
          <h2>
            ตารางรายการพัสดุทั้งหมด
            <span className="count-badge">{filteredPackages.length} ชิ้น</span>
          </h2>
          {hasActiveFilters && (
            <small style={{ color: 'var(--orange)', fontWeight: 600 }}>
              * กำลังแสดงผลตามตัวกรองที่เลือก
            </small>
          )}
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>เลขพัสดุ</th>
                <th>ชื่อผู้รับ</th>
                <th>รหัสนักศึกษา</th>
                <th>ตรวจสอบฐานข้อมูล</th>
                <th>ห้อง / ตึก</th>
                <th>เบอร์โทร</th>
                <th>วันที่รับเข้า</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'center', minWidth: '150px' }}>การจัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.length ? (
                filteredPackages.map(({ item, index }) => {
                  const matchStatus = getStudentMatchStatus(item)
                  return (
                    <tr key={item.tracking + index}>
                      <td>
                        <strong>{item.tracking}</strong>
                      </td>
                      <td>
                        <b>{item.recipient}</b>
                      </td>
                      <td>{item.studentId || '-'}</td>
                      <td>
                        {matchStatus.matched ? (
                          <span className="badge verified" title="ชื่อตรงกับฐานข้อมูลนักศึกษา">
                            ✓ ตรงฐานข้อมูล
                          </span>
                        ) : (
                          <span className="badge warning" title={matchStatus.reason}>
                            ⚠️ ไม่ตรงฐานข้อมูล
                          </span>
                        )}
                      </td>
                      <td>
                        {matchStatus.matched ? `${item.room} (ตึก ${item.building})` : '-'}
                      </td>
                      <td>{matchStatus.matched ? (item.phone || '-') : '-'}</td>
                      <td>{item.date}</td>
                      <td>
                        <span
                          className={`badge ${item.status === 'รับแล้ว' ? 'done' : 'pending'}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="btn-actions">
                          <button
                            type="button"
                            className="btn-action btn-edit"
                            title="แก้ไขข้อมูลพัสดุ"
                            onClick={() => onEdit(item, index)}
                          >
                            ✏️ แก้ไข
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-delete"
                            title="ลบพัสดุนี้ออกจากระบบ"
                            onClick={() => onDelete(item, index)}
                          >
                            🗑️ ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '36px 15px' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '13px' }}>
                      <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>
                        📦
                      </span>
                      ไม่พบรายการพัสดุที่ตรงกับการค้นหาหรือตัวกรอง
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
