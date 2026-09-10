import { useMemo } from 'react'
import { mockStudents, getStudentMatchStatus } from '../data/mockData'

export default function PackageForm({
  form,
  setForm,
  photoUrl,
  setPhotoUrl,
  isEditing,
  onSave,
  onCancel,
  onDashboard,
}) {
  const update = event =>
    setForm(current => ({ ...current, [event.target.name]: event.target.value }))

  const choosePhoto = event => {
    const file = event.target.files?.[0]
    if (file) setPhotoUrl(URL.createObjectURL(file))
  }

  // ตรวจสอบกับฐานข้อมูลนักศึกษาแบบเรียลไทม์ขณะกรอก (Live verification)
  const matchInfo = useMemo(() => {
    if (!form.studentId && !form.recipient) return null
    return getStudentMatchStatus(form)
  }, [form.studentId, form.recipient])

  // ดึงข้อมูลนักศึกษาตามรหัสที่กรอกเพื่อช่วยอำนวยความสะดวกในการกรอก
  const matchedStudentFromDb = useMemo(() => {
    if (!form.studentId) return null
    return mockStudents.find(s => s.student_id === form.studentId) || null
  }, [form.studentId])

  const autoFillFromStudent = student => {
    setForm(current => ({
      ...current,
      recipient: student.fullNameTh || `${student.first_name} ${student.last_name}`,
      room: student.room_number || current.room,
      building: student.building || current.building,
      phone: student.phone || current.phone,
    }))
  }

  return (
    <section className="page active-page">
      <div className="breadcrumbs">
        <button
          type="button"
          className="brand-button breadcrumb-link"
          onClick={onDashboard}
        >
          หน้าหลัก
        </button>
        <span>/</span>
        <button
          type="button"
          className="brand-button breadcrumb-link"
          onClick={onCancel}
        >
          จัดการพัสดุ
        </button>
        <span>/</span>
        <b>{isEditing ? `แก้ไขข้อมูลพัสดุ (${form.tracking || ''})` : 'บันทึกพัสดุใหม่'}</b>
      </div>

      <section className="form-card">
        <form onSubmit={onSave}>
          <div className="form-side">
            <h2>{isEditing ? 'แก้ไขข้อมูลพัสดุ' : 'รายละเอียดพัสดุใหม่'}</h2>

            {/* แสดงสถานะการตรวจสอบกับฐานข้อมูลนักศึกษา (FR-01) */}
            {matchInfo && (
              <div className={`match-banner ${matchInfo.matched ? 'success' : 'warning'}`}>
                <span className="match-banner-icon">{matchInfo.matched ? '✓' : '⚠️'}</span>
                <div>
                  <strong>
                    {matchInfo.matched
                      ? 'ตรวจสอบแล้ว: ชื่อตรงกับข้อมูลในฐานข้อมูลนักศึกษา'
                      : 'พัสดุที่ชื่อไม่ตรงกับข้อมูลในฐานข้อมูลนักศึกษา'}
                  </strong>
                  <div className="match-banner-desc">
                    {matchInfo.matched
                      ? `พบข้อมูลนักศึกษา: ${matchInfo.student.fullNameTh} (หอพักตึก ${matchInfo.student.building} ห้อง ${matchInfo.student.room_number})`
                      : matchInfo.reason || 'ชื่อหรือรหัสผู้รับไม่ตรงกับข้อมูลในระบบหอพัก'}
                  </div>
                </div>
              </div>
            )}

            {matchedStudentFromDb && !matchInfo?.matched && (
              <div
                className="match-banner info"
                style={{ justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  💡 พบรหัสนักศึกษานี้ในระบบ: <b>{matchedStudentFromDb.fullNameTh}</b> (ตึก{' '}
                  {matchedStudentFromDb.building}, ห้อง {matchedStudentFromDb.room_number})
                </div>
                <button
                  type="button"
                  className="outline"
                  style={{ padding: '4px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  onClick={() => autoFillFromStudent(matchedStudentFromDb)}
                >
                  นำข้อมูลมาเติม
                </button>
              </div>
            )}

            <div className="form-grid">
              <Field
                label="เลขพัสดุ (Tracking Number)"
                name="tracking"
                form={form}
                update={update}
                placeholder="เช่น PKG-20260901-001"
                required
              />
              <Field
                label="รหัสนักศึกษา"
                name="studentId"
                form={form}
                update={update}
                placeholder="เช่น 65000001"
                required
              />
              <Field
                label="ชื่อผู้รับ (นักศึกษา/ผู้รับ)"
                name="recipient"
                form={form}
                update={update}
                placeholder="เช่น สมหญิง ใจดี"
                required
              />
              <Field
                label="เบอร์โทรศัพท์"
                name="phone"
                form={form}
                update={update}
                placeholder="0891234567"
              />
              <Field
                label="ห้อง"
                name="room"
                form={form}
                update={update}
                placeholder="A-204"
                required
              />
              <label>
                ตึกพัก
                <select name="building" value={form.building} onChange={update}>
                  <option value="A">หอพักชาย ตึก A</option>
                  <option value="B">หอพักหญิง ตึก B</option>
                </select>
              </label>

              {isEditing && (
                <label>
                  สถานะพัสดุ
                  <select
                    name="status"
                    value={form.status || 'รอรับพัสดุ'}
                    onChange={update}
                  >
                    <option value="รอรับพัสดุ">รอรับพัสดุ</option>
                    <option value="รับแล้ว">รับแล้ว</option>
                  </select>
                </label>
              )}
            </div>

            <label>
              หมายเหตุ
              <textarea
                name="note"
                value={form.note}
                onChange={update}
                placeholder="กรอกรายละเอียดเพิ่มเติม เช่น มีรอยบุบ, พัสดุเก็บเงินปลายทาง"
              />
            </label>

            <div className="actions">
              <button className="primary" type="submit">
                {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลพัสดุ'}
              </button>
              <button className="secondary" type="button" onClick={onCancel}>
                ยกเลิก
              </button>
            </div>
          </div>

          <div className="photo-side">
            <h3>ถ่ายภาพกล่องพัสดุ</h3>
            <div
              className="photo-preview"
              style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
            >
              {!photoUrl && (
                <>
                  <span>📦</span>
                  <p>ยังไม่มีรูปภาพ</p>
                </>
              )}
            </div>
            <div className="photo-actions">
              <label className="outline upload-label">
                ▧&nbsp; เลือกไฟล์
                <input type="file" accept="image/*" hidden onChange={choosePhoto} />
              </label>
              <button
                className="secondary"
                type="button"
                onClick={() => setPhotoUrl('')}
              >
                ล้างไฟล์
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>
  )
}

function Field({ label, name, form, update, ...props }) {
  return (
    <label>
      {label}
      <input name={name} value={form[name] || ''} onChange={update} {...props} />
    </label>
  )
}
