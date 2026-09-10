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

  // ตรวจสอบกับฐานข้อมูลนักศึกษาแบบเรียลไทม์ขณะกรอกชื่อผู้รับ (Live verification)
  const matchInfo = useMemo(() => {
    if (!form.recipient?.trim()) return null
    return getStudentMatchStatus(form)
  }, [form.recipient, form.studentId])

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
            {matchInfo && form.recipient?.trim() && (
              <div className={`match-banner ${matchInfo.matched ? 'success' : 'warning'}`}>
                <span className="match-banner-icon">{matchInfo.matched ? '✓' : '⚠️'}</span>
                <div>
                  <strong>
                    {matchInfo.matched
                      ? 'ตรวจสอบแล้ว: ชื่อตรงกับข้อมูลในฐานข้อมูลนักศึกษา'
                      : 'พัสดุที่ชื่อไม่ตรงกับข้อมูลในฐานข้อมูลนักศึกษา'}
                  </strong>
                  <div className="match-banner-desc">
                    {matchInfo.matched ? (
                      <>
                        พบข้อมูล: <b>{matchInfo.student.fullNameTh}</b> (รหัส: {matchInfo.student.student_id} | หอพักตึก {matchInfo.student.building} ห้อง {matchInfo.student.room_number} | โทร: {matchInfo.student.phone})
                        <div style={{ marginTop: '4px', color: '#135200', fontSize: '11px', fontWeight: 600 }}>
                          ✨ ระบบจะดึงข้อมูลรหัสนักศึกษา, ห้อง, ตึก และเบอร์โทรศัพท์มาบันทึกให้อัตโนมัติ
                        </div>
                      </>
                    ) : (
                      matchInfo.reason || 'ไม่พบรายชื่อนี้ในฐานข้อมูลนักศึกษาหอพัก'
                    )}
                  </div>
                </div>
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
              <div>
                <Field
                  label="ชื่อผู้รับ (นักศึกษา/ผู้รับ)"
                  name="recipient"
                  form={form}
                  update={update}
                  placeholder="เช่น สมหญิง ใจดี"
                  list="students-list"
                  required
                />
                <datalist id="students-list">
                  {mockStudents.map(s => (
                    <option key={s.student_id} value={s.fullNameTh}>
                      {s.student_id} (ตึก {s.building} ห้อง {s.room_number})
                    </option>
                  ))}
                </datalist>
              </div>

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
