import { getStudentMatchStatus } from '../data/mockData'

export default function ConfirmDeleteModal({ target, onConfirm, onCancel }) {
  if (!target) return null
  const { item } = target
  const matchStatus = getStudentMatchStatus(item)

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h3>⚠️ ยืนยันการลบข้อมูลพัสดุ</h3>
        <p>
          คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลพัสดุนี้ออกจากระบบ? การดำเนินการนี้จะไม่สามารถเรียกคืนได้
        </p>
        <div className="modal-pkg-info">
          <div>
            <span>เลขพัสดุ:</span>
            <span>{item.tracking}</span>
          </div>
          <div>
            <span>ชื่อผู้รับ:</span>
            <span>{item.recipient}</span>
          </div>
          <div>
            <span>รหัสนักศึกษา:</span>
            <span>{item.studentId || '-'}</span>
          </div>
          <div>
            <span>ตรวจสอบฐานข้อมูล:</span>
            <span>{matchStatus.matched ? 'ตรงกับฐานข้อมูล' : 'ชื่อไม่ตรงกับฐานข้อมูล'}</span>
          </div>
          <div>
            <span>ห้อง / หอพัก:</span>
            <span>
              {item.room} (ตึก {item.building})
            </span>
          </div>
          <div>
            <span>สถานะปัจจุบัน:</span>
            <span>{item.status}</span>
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            ยกเลิก
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            ยืนยันการลบ
          </button>
        </div>
      </div>
    </div>
  )
}
