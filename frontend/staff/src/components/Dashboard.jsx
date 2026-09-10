import StatCard from './StatCard'
import { getStudentMatchStatus } from '../data/mockData'

export default function Dashboard({
  visiblePackages,
  unmatchedCount,
  todayReceived,
  totalReceived,
  filter,
  setFilter,
  onNew,
  onEdit,
}) {
  const filters = [
    ['all', 'แสดงข้อมูลทุกอย่างทั้งหมด'],
    ['A', 'หอพักชาย ตึก A'],
    ['B', 'หอพักหญิง ตึก B'],
    ['unmatched', 'พัสดุที่ชื่อไม่ตรงกับข้อมูลในฐานข้อมูลนักศึกษา'],
  ]

  return (
    <section className="page active-page">
      <div className="page-heading">
        <div>
          <h1>แดชบอร์ดเจ้าหน้าที่หอพัก</h1>
          <p>ภาพรวมข้อมูลพัสดุ ตรวจสอบและจัดการได้อย่างสะดวก</p>
        </div>
        <button className="primary" onClick={onNew} type="button">
          ＋ เพิ่มพัสดุใหม่
        </button>
      </div>

      <div className="stats">
        <StatCard icon="◴" tone="orange" label="พัสดุรอรับวันนี้" value="12" unit="ชิ้น" />
        <StatCard
          icon="!"
          tone="red"
          label="พัสดุชื่อไม่ตรงฐานข้อมูล"
          value={unmatchedCount}
          unit="ชิ้น"
        />
        <StatCard
          icon="✓"
          tone="green"
          label="พัสดุที่รับแล้วในวันนี้"
          value={todayReceived}
          unit="ชิ้น"
          subtext={
            <>
              พัสดุที่รับแล้วทั้งหมด: <b>{totalReceived}</b> ชิ้น
            </>
          }
        />
        <StatCard icon="♧" tone="gray" label="นักศึกษา/พักทั้งหมด" value="240" unit="คน" />
      </div>

      <section className="filter-card">
        <b className="filter-title">ตัวกรองด่วน:</b>
        <div className="filter-buttons-wrapper">
          {filters.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`filter ${filter === value ? 'selected' : ''}`}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="table-card">
        <div className="table-meta-bar">
          <h2>พัสดุลงทะเบียน ({visiblePackages.length} รายการ)</h2>
          {filter === 'all' && (
            <small className="filter-indicator-neutral">* กำลังแสดงข้อมูลทุกอย่างทั้งหมด</small>
          )}
          {filter === 'unmatched' && (
            <small className="filter-indicator-warning">
              * กำลังแสดงเฉพาะพัสดุที่ชื่อไม่ตรงกับข้อมูลในฐานข้อมูลนักศึกษา
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
                <th>ห้อง</th>
                <th>ตึก</th>
                <th>เบอร์โทร</th>
                <th>สถานะ</th>
                <th>วันที่รับเข้า</th>
              </tr>
            </thead>
            <tbody>
              {visiblePackages.length ? (
                visiblePackages.map(({ item, index }) => {
                  const matchStatus = getStudentMatchStatus(item)
                  return (
                    <tr
                      key={item.tracking + index}
                      onClick={() => onEdit(item, index)}
                      title="คลิกเพื่อดูหรือแก้ไขข้อมูล"
                    >
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
                      <td>{item.room}</td>
                      <td>
                        หอพัก{item.building === 'A' ? 'ชาย' : 'หญิง'} ตึก {item.building}
                      </td>
                      <td>{item.phone || '-'}</td>
                      <td>
                        <span
                          className={`badge ${item.status === 'รับแล้ว' ? 'done' : 'pending'}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{item.date}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '28px' }}>
                    ไม่พบรายการพัสดุตามเงื่อนไขที่เลือก
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
