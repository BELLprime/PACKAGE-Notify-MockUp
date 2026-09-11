// ฐานข้อมูลนักศึกษาจำลอง (สอดคล้องกับ SDD และ FR-01 / FR-04)
export const studentProfiles = [
  {
    id: '65000001',
    student_id: '65000001',
    name: 'สมชาย ดีใจ',
    building: 'A',
    room: 'ห้อง 302 ตึก A',
    room_number: '302',
    phone: '089-123-4567',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'TH55443322',
        sender: 'Lazada Mall Official',
        arrivedAt: '30 ส.ค. 2568 16:45',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=150&q=80'
      },
      {
        id: 'TH98765432',
        sender: 'ร้าน IT Gadget Store',
        arrivedAt: '1 ก.ย. 2568 09:15',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'
      },
      {
        id: 'TH12345678',
        sender: 'ร้าน ABC Shop (Shopee)',
        arrivedAt: 'วันนี้ 14:30 น.',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: 'เมื่อสักครู่', message: 'พัสดุใหม่ของคุณเลขที่ TH12345678 จัดส่งสำเร็จที่ห้องพัสดุตึก B แล้ว กรุณามาเซ็นรับ' },
      { time: 'เมื่อวานนี้ 09:16', message: 'พัสดุเลขที่ TH98765432 รับแล้วที่หอพัก' }
    ]
  },
  {
    id: '65000002',
    student_id: '65000002',
    name: 'สมหญิง ใจดี',
    building: 'B',
    room: 'ห้อง 202 ตึก B',
    room_number: '202',
    phone: '081-987-6543',
    profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260901-002',
        sender: 'Watsons Online Thailand',
        arrivedAt: 'วันนี้ 11:20 น.',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=150&q=80'
      },
      {
        id: 'TH33445566',
        sender: 'Shopee Official Store',
        arrivedAt: '28 ส.ค. 2568 13:00',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: 'เมื่อ 35 นาทีที่แล้ว', message: 'พัสดุใหม่ของคุณเลขที่ PKG-20260901-002 จาก Watsons ถึงห้องพัสดุตึก B แล้ว' }
    ]
  },
  {
    id: '65000003',
    student_id: '65000003',
    name: 'ธนโชติ จาติระดุก',
    building: 'A',
    room: 'ห้อง 301 ตึก A',
    room_number: '301',
    phone: '084-333-9876',
    profileImage: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'TH99001122',
        sender: 'Advice IT Infinite Store',
        arrivedAt: '29 ส.ค. 2568 10:45',
        status: 'รับแล้ว',
        image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: '2 วันที่แล้ว', message: 'พัสดุเลขที่ TH99001122 รับแล้วที่หอพัก' }
    ]
  },
  {
    id: '65000004',
    student_id: '65000004',
    name: 'มงคล อาษากิจ',
    building: 'A',
    room: 'ห้อง 409 ตึก A',
    room_number: '409',
    phone: '085-444-3210',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
    packages: [
      {
        id: 'PKG-20260824-007',
        sender: 'Central Online Store',
        arrivedAt: 'วันนี้ 09:30 น.',
        status: 'รอรับ',
        image: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=150&q=80'
      }
    ],
    notifications: [
      { time: 'เมื่อเช้านี้ 09:30', message: 'พัสดุใหม่ของคุณเลขที่ PKG-20260824-007 จัดส่งถึงห้องพัสดุตึก B แล้ว' }
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
    foundLocation: 'ห้องพัสดุตึก B (ชั้น 1)',
    broadcastAt: 'วันนี้ 13:15 น.',
    staffNote: 'จ่าหน้ามีเพียงข้อความ เด็กหอชั้น 3 ไม่มีรหัสและเลขห้อง สั่งจากร้านเคสโทรศัพท์',
    photoUrl: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=400&q=80',
    status: 'broadcasted', // 'broadcasted' | 'claimed' | 'matched'
    claimedBy: null,
    claimProof: null
  },
  {
    id: 'TH-UNK-002',
    tracking: 'TH982341209',
    carrier: 'Shopee Xpress',
    recipientOnBox: 'somchai (ไม่ระบุตึก/ห้อง)',
    foundLocation: 'ห้องพัสดุตึก B (โต๊ะพักของ)',
    broadcastAt: 'วันนี้ 10:40 น.',
    staffNote: 'จ่าหน้าเป็นภาษาอังกฤษ somchai ไม่มีเบอร์โทรศัพท์และห้องพัก กรุณาตรวจสอบเลขคำสั่งซื้อ Shopee',
    photoUrl: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=400&q=80',
    status: 'broadcasted',
    claimedBy: null,
    claimProof: null
  },
  {
    id: 'PKG-20260831-009',
    tracking: 'PKG-20260831-009',
    carrier: 'Kerry Express',
    recipientOnBox: 'วินัย รัตนา (ระบุรหัส 65000003)',
    foundLocation: 'ห้องพัสดุตึก A',
    broadcastAt: 'เมื่อวานนี้ 16:20 น.',
    staffNote: 'ชื่อจ่าหน้าไม่ตรงกับรหัส 65000003 (ในระบบคือ ธนโชติ จาติระดุก) หมึกเลอะบางส่วน',
    photoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=400&q=80',
    status: 'claimed',
    claimedBy: 'ธนโชติ จาติระดุก (65000003)',
    claimProof: 'ญาติส่งของมาให้ครับ แต่ลงชื่อผู้สั่งเป็นชื่อคุณพ่อ วินัย รัตนา ครับ'
  },
  {
    id: 'TH-UNK-004',
    tracking: 'JNT772910394',
    carrier: 'J&T Express',
    recipientOnBox: 'น้องหญิง ตึก B ชั้น 2',
    foundLocation: 'ห้องพัสดุตึก B',
    broadcastAt: '2 วันก่อน',
    staffNote: 'กล่องขนาดเล็ก ห่อบับเบิ้ลสีชมพู จับคู่ยืนยันตัวตนเรียบร้อยแล้ว',
    photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
    status: 'matched',
    claimedBy: 'สมหญิง ใจดี (65000002)',
    claimProof: 'หลักฐานสลิปคำสั่งซื้อจาก TikTok Shop แฟชั่น'
  }
];
