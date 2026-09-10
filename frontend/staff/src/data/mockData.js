// ฐานข้อมูลนักศึกษาจำลอง (สอดคล้องกับ mock_students.json และข้อกำหนด FR-01)
export const mockStudents = [
  {
    student_id: '65000001',
    first_name: 'Natthakit',
    last_name: 'Rodruean',
    fullNameTh: 'ณัฐกิตติ์ รอดเรือน',
    building: 'A',
    room_number: '302',
    phone: '0891234567',
  },
  {
    student_id: '65000002',
    first_name: 'สมหญิง',
    last_name: 'ใจดี',
    fullNameTh: 'สมหญิง ใจดี',
    building: 'B',
    room_number: '202',
    phone: '0819876543',
  },
  {
    student_id: '65000003',
    first_name: 'ธนโชติ',
    last_name: 'จาติระดุก',
    fullNameTh: 'ธนโชติ จาติระดุก',
    building: 'A',
    room_number: '301',
    phone: '0843339876',
  },
  {
    student_id: '65000004',
    first_name: 'มงคล',
    last_name: 'อาษากิจ',
    fullNameTh: 'มงคล อาษากิจ',
    building: 'A',
    room_number: '409',
    phone: '0854443210',
  },
  {
    student_id: '65000005',
    first_name: 'ปกรณ์',
    last_name: 'มั่นคง',
    fullNameTh: 'ปกรณ์ มั่นคง',
    building: 'A',
    room_number: '402',
    phone: '0865551234',
  },
]

// ฟังก์ชันตรวจสอบว่าชื่อและรหัสพัสดุตรงกับฐานข้อมูลนักศึกษาหรือไม่ (FR-01)
export function getStudentMatchStatus(pkg) {
  if (!pkg.recipient && !pkg.studentId) {
    return { matched: false, reason: 'ไม่มีข้อมูลผู้รับ' }
  }
  const normRecipient = (pkg.recipient || '').trim().toLowerCase()

  // กรณีมีรหัสนักศึกษาระบุไว้
  if (pkg.studentId && pkg.studentId !== '-') {
    const byId = mockStudents.find(s => s.student_id === pkg.studentId)
    if (byId) {
      const matchName =
        (byId.first_name && normRecipient.includes(byId.first_name.toLowerCase())) ||
        (byId.fullNameTh && normRecipient.includes(byId.fullNameTh.toLowerCase())) ||
        (byId.last_name && normRecipient.includes(byId.last_name.toLowerCase()))
      if (matchName) {
        return { matched: true, student: byId }
      } else {
        return {
          matched: false,
          student: byId,
          reason: `รหัส ${pkg.studentId} ในฐานข้อมูลคือ "${byId.fullNameTh}" แต่ชื่อผู้รับที่จ่าหน้าคือ "${pkg.recipient}"`,
        }
      }
    }
  }

  // ค้นหาจากชื่อผู้รับ (Recipient Name Match)
  if (normRecipient) {
    const byName = mockStudents.find(s => {
      const fn = (s.first_name || '').toLowerCase()
      const ln = (s.last_name || '').toLowerCase()
      const full = (s.fullNameTh || '').toLowerCase()
      return (
        (fn && normRecipient.includes(fn)) ||
        (ln && normRecipient.includes(ln)) ||
        (full && (normRecipient.includes(full) || full.includes(normRecipient)))
      )
    })
    if (byName) {
      return { matched: true, student: byName }
    }
  }

  return { matched: false, reason: 'ไม่พบข้อมูลนักศึกษารายชื่อนี้ในฐานข้อมูลหอพัก' }
}

export const initialPackages = [
  {
    tracking: 'PKG-20260901-001',
    recipient: 'สมชาย ใจดี',
    studentId: '65000001',
    phone: '0891234567',
    room: 'A-204',
    building: 'A',
    status: 'รอรับพัสดุ',
    date: '1 ก.ย. 2569',
    note: 'ชื่อไม่ตรงกับรหัส 65000001 (ในระบบคือ ณัฐกิตติ์)',
  },
  {
    tracking: 'PKG-20260901-002',
    recipient: 'สมหญิง ใจดี',
    studentId: '65000002',
    phone: '0819876543',
    room: 'B-202',
    building: 'B',
    status: 'รอรับพัสดุ',
    date: '1 ก.ย. 2569',
    note: '',
  },
  {
    tracking: 'PKG-20260831-014',
    recipient: 'ปกรณ์ มั่นคง',
    studentId: '65000005',
    phone: '0865551234',
    room: 'A-402',
    building: 'A',
    status: 'รับแล้ว',
    date: '31 ส.ค. 2569',
    note: '',
  },
  {
    tracking: 'PKG-20260831-009',
    recipient: 'วินัย รัตนา',
    studentId: '65000003',
    phone: '0843339876',
    room: 'A-204',
    building: 'A',
    status: 'รับแล้ว',
    date: '31 ส.ค. 2569',
    note: 'ชื่อไม่ตรงกับรหัส 65000003 (ในระบบคือ ธนโชติ)',
  },
  {
    tracking: 'PKG-20260825-003',
    recipient: 'พัสดุไม่ระบุชื่อชัดเจน',
    studentId: '65000099',
    phone: '0821114567',
    room: 'A-312',
    building: 'A',
    status: 'รอรับพัสดุ',
    date: '25 ส.ค. 2569',
    note: 'จ่าหน้าไม่ชัดเจน',
  },
  {
    tracking: 'PKG-20260824-007',
    recipient: 'มงคล อาษากิจ',
    studentId: '65000004',
    phone: '0854443210',
    room: 'A-409',
    building: 'A',
    status: 'รอรับพัสดุ',
    date: '24 ส.ค. 2569',
    note: '',
  },
]

export const blankForm = {
  tracking: '',
  studentId: '',
  recipient: '',
  phone: '',
  room: '',
  building: 'A',
  status: 'รอรับพัสดุ',
  note: '',
}
