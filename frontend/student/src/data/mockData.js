// ฐานข้อมูลนักศึกษาและพัสดุตรงตามฐานข้อมูล MongoDB (package_notify_db) 100%
export const studentProfiles = [
  {
    id: '65000001',
    student_id: '65000001',
    name: 'Natthakit Rodruean',
    building: 'S21',
    room: 'ห้อง 302 ตึก S21',
    room_number: '302',
    phone: '089-123-4567',
    line_user_id: 'Bell',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260901-001',
        sender: 'Kerry Express (ผู้รับบนกล่อง: สมชาย ใจดี)',
        arrivedAt: '1 ก.ย. 2569 14:30',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80',
        note: 'ชื่อไม่ตรงกับรหัส 65000001 (ในระบบคือ Natthakit Rodruean)'
      }
    ],
    notifications: [
      { time: '1 ก.ย. 14:30', message: 'พัสดุเลขที่ PKG-20260901-001 ถึงห้องพัสดุตึก S21 แล้ว แต่ชื่อผู้รับระบุ สมชาย ใจดี ไม่ตรงกับฐานข้อมูล' }
    ]
  },
  {
    id: '65000002',
    student_id: '65000002',
    name: 'สมหญิง ใจดี',
    building: 'S20',
    room: 'ห้อง 202 ตึก S20',
    room_number: '202',
    phone: '081-987-6543',
    line_user_id: 'Pama',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260901-002',
        sender: 'Watsons Online Thailand',
        arrivedAt: '1 ก.ย. 2569 11:20',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: '1 ก.ย. 11:20', message: 'พัสดุใหม่ของคุณเลขที่ PKG-20260901-002 จาก Watsons ถึงห้องพัสดุตึก S20 แล้ว' }
    ]
  },
  {
    id: '65000003',
    student_id: '65000003',
    name: 'ธนโชติ จาติระดุก',
    building: 'S21',
    room: 'ห้อง 301 ตึก S21',
    room_number: '301',
    phone: '084-333-9876',
    line_user_id: 'Pluem',
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260831-009',
        sender: 'Kerry Express (วินัย รัตนา)',
        arrivedAt: '31 ส.ค. 2569 10:00',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80',
        note: 'ชื่อไม่ตรงกับรหัส 65000003 (ยืนยันสิทธิ์และรับแล้ว)'
      }
    ],
    notifications: [
      { time: '31 ส.ค. 18:00', message: 'พัสดุเลขที่ PKG-20260831-009 ได้รับการยืนยันสิทธิ์และลงชื่อรับพัสดุเรียบร้อยแล้ว' }
    ]
  },
  {
    id: '65000004',
    student_id: '65000004',
    name: 'มงคล อาษากิจ',
    building: 'S22',
    room: 'ห้อง 409 ตึก S22',
    room_number: '409',
    phone: '085-444-3210',
    line_user_id: 'Fluke',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260824-007',
        sender: 'Central Online Store',
        arrivedAt: '24 ส.ค. 2569 09:30',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: '24 ส.ค. 09:30', message: 'พัสดุใหม่ของคุณเลขที่ PKG-20260824-007 จัดส่งถึงห้องพัสดุตึก S22 แล้ว' }
    ]
  },
  {
    id: '65000005',
    student_id: '65000005',
    name: 'Pama Confused',
    building: 'S20',
    room: 'ห้อง 222 ตึก S20',
    room_number: '222',
    phone: '086-555-1234',
    line_user_id: 'Pama_confused99',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260831-014',
        sender: 'Flash Express (ผู้รับบนกล่อง: ปกรณ์ มั่นคง)',
        arrivedAt: '31 ส.ค. 2569 16:45',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=150&q=80',
        note: 'ชื่อไม่ตรงกับรหัส 65000005 (ในระบบคือ Pama Confused)'
      }
    ],
    notifications: [
      { time: '31 ส.ค. 17:30', message: 'พัสดุเลขที่ PKG-20260831-014 จ่าหน้าถึง ปกรณ์ มั่นคง ได้รับการเซ็นรับเรียบร้อยแล้ว' }
    ]
  }
];

// รายการพัสดุที่ไม่ทราบชื่อที่ถูกส่ง Broadcast มายังบอร์ดกลาง (FR-04 / Task 11)
export const initialBroadcastPackages = [
  {
    id: 'PKG-20260825-003',
    tracking: 'PKG-20260825-003',
    carrier: 'Flash Express',
    recipientOnBox: 'พัสดุไม่ระบุชื่อชัดเจน (เด็กหอชั้น 3)',
    foundLocation: 'ห้องพัสดุตึก S20 (ชั้น 1)',
    broadcastAt: '25 ส.ค. 2569 13:15',
    staffNote: 'จ่าหน้ามีเพียงข้อความ เด็กหอชั้น 3 ไม่มีรหัสและเลขห้อง สั่งจากร้านเคสโทรศัพท์',
    photoUrl: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=400&q=80',
    status: 'broadcasted', // 'broadcasted' | 'claimed' | 'matched'
    claimedBy: null,
    claimProof: null
  },
  {
    id: 'PKG-20260831-009',
    tracking: 'PKG-20260831-009',
    carrier: 'Kerry Express',
    recipientOnBox: 'วินัย รัตนา (ระบุรหัส 65000003)',
    foundLocation: 'ห้องพัสดุตึก S21',
    broadcastAt: '31 ส.ค. 2569 16:20',
    staffNote: 'ชื่อจ่าหน้าไม่ตรงกับรหัส 65000003 (ในระบบคือ ธนโชติ จาติระดุก) หมึกเลอะบางส่วน',
    photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    status: 'claimed',
    claimedBy: 'ธนโชติ จาติระดุก (65000003)',
    claimProof: 'ญาติส่งของมาให้ครับ แต่ลงชื่อผู้สั่งเป็นชื่อคุณพ่อ วินัย รัตนา ครับ'
  }
];
