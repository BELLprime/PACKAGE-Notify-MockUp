import React, { useState, useEffect, useRef, Fragment } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { ChatTimelineFilterBar, BroadcastChatCard, ClaimModal } from './components/BroadcastBoard'
import { studentProfiles, initialBroadcastPackages } from './data/mockData'
import '../style.css'

export default function App() {
  // Navigation & Multi-student States
  const [studentList, setStudentList] = useState(studentProfiles);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [chatTimelineFilter, setChatTimelineFilter] = useState('all'); // 'all' | 'personal' | 'broadcast' (Task 11)

  // Task 11 Broadcast Board States (สอดคล้องตามข้อกำหนด FR-04)
  const [broadcastPackages, setBroadcastPackages] = useState(initialBroadcastPackages);
  const [broadcastSearch, setBroadcastSearch] = useState('');
  const [broadcastStatusFilter, setBroadcastStatusFilter] = useState('all'); // 'all' | 'broadcasted' | 'claimed' | 'matched'
  const [claimModalPackage, setClaimModalPackage] = useState(null);
  const [claimEvidence, setClaimEvidence] = useState('');

  // LINE Chat States
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'waiting' | 'done' | 'official'
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null); // for signature modal
  const [selectedChatId, setSelectedChatId] = useState('dormtrack'); // 'dormtrack' is the ONLY ONE with confirm button
  const [mobileOpenChatId, setMobileOpenChatId] = useState(null); // for Mobile screen opening a chat
  const [readChatIds, setReadChatIds] = useState(['dormtrack']); // marked as read when entered
  const [dormTrackUnreadCount, setDormTrackUnreadCount] = useState(0); // real-time unread notification count
  const [toastList, setToastList] = useState([]); // Task: Stacked toast notifications (แจ้งเตือนแบบ stack)
  const [showBanner, setShowBanner] = useState(true);
  const [viewMode, setViewMode] = useState('auto'); // 'auto' | 'mobile' | 'desktop'
  const [showMobileTextInput, setShowMobileTextInput] = useState(false); // toggle between 'เมนู ▴' and input field

  const currentStudent = studentList[selectedStudentIndex] || studentList[0];
  const student = currentStudent;
  const packages = currentStudent.packages || [];
  const notifications = currentStudent.notifications || [];

  // ระบบแจ้งเตือนแบบ Stack (Stacked Toast Notifications)
  const pushNotification = (notif) => {
    const newNotif = {
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: notif.title || 'ระบบติดตามพัสดุหอพัก (มทร. ล้านนา)',
      sender: notif.sender || 'เจ้าหน้าที่หอพัก',
      time: notif.time || 'เมื่อสักครู่',
      message: notif.message || '',
      chatId: notif.chatId || 'dormtrack',
      filter: notif.filter || (notif.sender?.includes('Broadcast') || notif.sender?.includes('ประกาศ') ? 'broadcast' : 'all')
    };

    setToastList(prev => [newNotif, ...prev.slice(0, 3)]); // stack สูงสุด 4 การแจ้งเตือน ล่าสุดอยู่บน

    // เคลียร์อัตโนมัติเมื่อครบ 6 วินาที
    setTimeout(() => {
      setToastList(prev => prev.filter(t => t.id !== newNotif.id));
    }, 6000);
  };

  // LINE-style soft chime notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  };

  // Switch Student Profile (สำหรับทดสอบเห็น Broadcast และแชทต่างคน)
  const handleChangeStudent = (index) => {
    setSelectedStudentIndex(index);
    setDormTrackUnreadCount(0);
    setReadChatIds(prev => prev.includes('dormtrack') ? prev : [...prev, 'dormtrack']);
    playNotificationSound();
    pushNotification({
      id: `switch-${studentList[index].student_id || studentList[index].id}-${Date.now()}`,
      sender: '👤 สลับบัญชีผู้ใช้งาน',
      time: 'เมื่อสักครู่',
      message: `คุณกำลังดูระบบในนาม ${studentList[index].name} (${studentList[index].room})`
    });
  };

  // Submit Claim Ownership for Task 11 (FR-04)
  const handleConfirmClaim = async () => {
    if (!claimModalPackage) return;
    if (!claimEvidence.trim()) {
      alert('กรุณาระบุหลักฐานยืนยันความเป็นเจ้าของ');
      return;
    }

    const targetPkg = claimModalPackage;
    const pkgId = targetPkg.tracking || targetPkg.id;
    const studentClaimant = `${currentStudent.name} (${currentStudent.student_id || currentStudent.id})`;

    // ส่งคำสั่ง PUT ไปยัง Backend API / MongoDB
    try {
      await fetch(`http://localhost:5000/api/packages/${pkgId}/claim`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimed_by: studentClaimant,
          claim_proof: claimEvidence.trim(),
          student_id: currentStudent.student_id || currentStudent.id
        })
      });
    } catch (err) {
      console.warn('Backend claim failed:', err);
    }

    setBroadcastPackages(prev => prev.map(p => {
      if (p.id === targetPkg.id || p.tracking === targetPkg.tracking) {
        return {
          ...p,
          status: 'claimed',
          claimedBy: studentClaimant,
          claimProof: claimEvidence.trim()
        };
      }
      return p;
    }));

    playNotificationSound();
    pushNotification({
      id: `claim-${targetPkg.tracking}-${Date.now()}`,
      sender: '📢 ประกาศพัสดุไม่ทราบชื่อ',
      time: 'เมื่อสักครู่',
      message: `แจ้งสิทธิ์พัสดุ ${targetPkg.tracking} สำเร็จแล้ว เจ้าหน้าที่หอพักจะตรวจสอบหลักฐาน`
    });

    setClaimModalPackage(null);
    setClaimEvidence('');
  };

  // รีเซ็ตข้อมูลทั้งหมดของ Student UI กลับสู่ค่าเริ่มต้น
  const handleResetAll = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลและประกาศพัสดุกลับสู่ค่าเริ่มต้นหรือไม่?')) {
      setStudentList(studentProfiles);
      setSelectedStudentIndex(0);
      setBroadcastPackages(initialBroadcastPackages);
      setDormTrackUnreadCount(0);
      playNotificationSound();
      pushNotification({
        id: 'reset-' + Date.now(),
        sender: '⚙️ ระบบส่วนกลาง',
        time: 'เมื่อสักครู่',
        message: '🔄 รีเซ็ตข้อมูลระบบนักศึกษากลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว'
      });
      try {
        await fetch('http://localhost:5000/api/packages/reset', { method: 'POST' });
      } catch (e) {}
    }
  };

  // Auto-sync / Real-time Poll สำหรับดึง Broadcast และพัสดุใหม่จาก Backend
  const knownBroadcastKeysRef = useRef(new Set());
  const knownPersonalPkgKeysRef = useRef(new Set());
  const lastResetTimeRef = useRef(null);
  const lastUpdateTimeRef = useRef(null);
  const selectedStudentIndexRef = useRef(selectedStudentIndex);

  useEffect(() => {
    selectedStudentIndexRef.current = selectedStudentIndex;
  }, [selectedStudentIndex]);

  // ซิงค์ข้อมูลพัสดุจริงจาก Backend API / MongoDB เข้าสู่โปรไฟล์นักศึกษา
  const syncPackagesFromDB = async (isInitial = false) => {
    try {
      const res = await fetch('http://localhost:5000/api/packages');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) return;
      const dbPkgs = json.data;

      // ตรวจหาพัสดุใหม่ที่เพิ่งเพิ่มเข้ามาในระบบ
      let hasNewForCurrent = false;
      let newForCurrentPkg = null;
      let hasNewForOther = false;
      let newForOtherPkg = null;

      const activeStudent = studentList[selectedStudentIndexRef.current] || currentStudent;
      const currentStId = activeStudent.student_id || activeStudent.id;

      dbPkgs.forEach(p => {
        const key = p.tracking;
        if (!knownPersonalPkgKeysRef.current.has(key)) {
          knownPersonalPkgKeysRef.current.add(key);
          if (!isInitial) {
            if (p.student_id === currentStId) {
              hasNewForCurrent = true;
              newForCurrentPkg = p;
            } else if (p.student_id) {
              hasNewForOther = true;
              newForOtherPkg = p;
            }
          }
        }
      });

      // หากมีพัสดุใหม่สำหรับนักศึกษาคนปัจจุบันที่กำลังดูหน้าจออยู่
      if (hasNewForCurrent && newForCurrentPkg) {
        playNotificationSound();
        setDormTrackUnreadCount(prev => prev + 1);
        setReadChatIds(prev => prev.filter(id => id !== 'dormtrack'));
        pushNotification({
          id: `new-pkg-${newForCurrentPkg.tracking}-${Date.now()}`,
          sender: '📦 ระบบติดตามพัสดุหอพัก (LINE Official)',
          time: 'เมื่อสักครู่',
          message: `แจ้งเตือนพัสดุใหม่! เลขที่ [${newForCurrentPkg.tracking}] จ่าหน้า "${newForCurrentPkg.recipient}" มาถึงห้องพัสดุแล้ว กรุณาตรวจสอบและเซ็นรับ`,
          chatId: 'dormtrack',
          filter: 'personal'
        });
        scrollToBottom();
      } else if (hasNewForOther && newForOtherPkg) {
        // หากเป็นพัสดุของเพื่อนร่วมหอพัก
        playNotificationSound();
        pushNotification({
          id: `new-pkg-${newForOtherPkg.tracking}-${Date.now()}`,
          sender: '🏢 เจ้าหน้าที่หอพัก (บันทึกพัสดุใหม่)',
          time: 'เมื่อสักครู่',
          message: `มีพัสดุใหม่ [${newForOtherPkg.tracking}] ของ ${newForOtherPkg.recipient} (${newForOtherPkg.student_id}) เข้าสู่ระบบหอพัก`,
          chatId: 'dormtrack',
          filter: 'all'
        });
      }

      setStudentList(prevStudents => prevStudents.map(st => {
        const stPkgs = dbPkgs.filter(p => p.student_id === (st.student_id || st.id));
        if (stPkgs.length === 0) return st;
        return {
          ...st,
          packages: stPkgs.map(p => ({
            id: p.tracking,
            tracking: p.tracking,
            sender: p.note || 'ห้องพัสดุหอพัก',
            arrivedAt: p.arrival_date ? new Date(p.arrival_date).toLocaleString('th-TH') : 'วันนี้',
            arrival_date: p.arrival_date,
            createdAt: p.createdAt,
            status: p.status === 'received' ? 'รับแล้ว' : 'รอรับ',
            image: p.photo_url || 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=300&q=80'
          }))
        };
      }));
    } catch (err) {
      // Backend offline, fallback to studentProfiles in mockData
    }
  };

  useEffect(() => {
    initialBroadcastPackages.forEach(p => knownBroadcastKeysRef.current.add(p.tracking || p.id));
    studentProfiles.forEach(st => {
      st.packages?.forEach(p => knownPersonalPkgKeysRef.current.add(p.id || p.tracking));
    });
    syncPackagesFromDB(true);

    const pollBroadcasts = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/packages/broadcasts');
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success || !Array.isArray(json.data)) return;

        // ตรวจสอบว่ามีการอัปเดตข้อมูลใน MongoDB หรือไม่ (เช่น เพิ่มพัสดุใหม่ เซ็นรับ หรือเคลมพัสดุ)
        if (json.lastUpdateTime) {
          if (lastUpdateTimeRef.current !== null && json.lastUpdateTime > lastUpdateTimeRef.current) {
            // ดึงข้อมูลพัสดุส่วนตัวใหม่ทันทีเมื่อมีการอัปเดตข้อมูลในระบบ
            syncPackagesFromDB(false);
          }
          lastUpdateTimeRef.current = json.lastUpdateTime;
        }

        // ตรวจสอบว่า Staff เพิ่งกดปุ่ม Reset หรือไม่
        if (json.resetTime) {
          if (lastResetTimeRef.current !== null && json.resetTime > lastResetTimeRef.current) {
            // เมื่อ Staff กด Reset จากฝั่งเจ้าหน้าที่ ให้ Student UI รีเซ็ตตามอัตโนมัติทันที
            setStudentList(studentProfiles);
            setSelectedStudentIndex(0);
            setBroadcastPackages(initialBroadcastPackages);
            knownBroadcastKeysRef.current = new Set(initialBroadcastPackages.map(p => p.tracking || p.id));
            knownPersonalPkgKeysRef.current = new Set();
            studentProfiles.forEach(st => {
              st.packages?.forEach(p => knownPersonalPkgKeysRef.current.add(p.id || p.tracking));
            });
            setDormTrackUnreadCount(0);
            syncPackagesFromDB(true);
            playNotificationSound();
            pushNotification({
              id: 'staff-reset-' + Date.now(),
              sender: '🏢 เจ้าหน้าที่หอพัก (Staff)',
              time: 'เมื่อสักครู่',
              message: '🔄 เจ้าหน้าที่ได้รีเซ็ตระบบ: ข้อมูลพัสดุและบอร์ดประกาศถูกปรับเป็นค่าเริ่มต้นแล้ว'
            });
          }
          lastResetTimeRef.current = json.resetTime;
        }

        // อัปเดตสถานะเคลม/รับพัสดุของ Broadcast ในบอร์ดให้ตรงกับ DB
        setBroadcastPackages(prev => {
          return prev.map(p => {
            const serverMatch = json.data.find(item => item.tracking === p.tracking);
            if (serverMatch) {
              return {
                ...p,
                status: serverMatch.status === 'claimed' ? 'claimed' : (serverMatch.status === 'received' ? 'matched' : p.status),
                claimedBy: serverMatch.claimed_by || p.claimedBy,
                claimProof: serverMatch.claim_proof || p.claimProof
              };
            }
            return p;
          });
        });

        let hasNew = false;
        let latestItem = null;

        json.data.forEach(item => {
          const key = item.tracking || item._id;
          if (!knownBroadcastKeysRef.current.has(key)) {
            knownBroadcastKeysRef.current.add(key);
            hasNew = true;
            latestItem = item;
          }
        });

        if (hasNew && latestItem) {
          playNotificationSound();
          setDormTrackUnreadCount(prev => prev + 1);
          pushNotification({
            id: latestItem.tracking,
            sender: '📢 ประกาศพัสดุไม่ทราบชื่อ (ส่งจาก Staff)',
            time: 'เมื่อสักครู่',
            message: `พบพัสดุไม่ทราบชื่อ [${latestItem.tracking}] จ่าหน้า "${latestItem.recipient}" กรุณาตรวจสอบที่ Broadcast Board`
          });

          setBroadcastPackages(prev => {
            const exists = prev.some(p => p.tracking === latestItem.tracking);
            if (exists) return prev;
            return [
              {
                id: latestItem.tracking,
                tracking: latestItem.tracking,
                carrier: 'Flash Express',
                recipientOnBox: latestItem.recipient,
                foundLocation: 'ห้องธุรการหอพัก',
                broadcastAt: 'เมื่อสักครู่',
                staffNote: latestItem.note || 'เจ้าหน้าที่ได้ส่งประกาศหาเจ้าของผ่าน Staff UI',
                photoUrl: latestItem.photo_url || 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=400&q=80',
                status: latestItem.status === 'claimed' ? 'claimed' : (latestItem.status === 'received' ? 'matched' : 'broadcasted'),
                claimedBy: latestItem.claimed_by || null,
                claimProof: latestItem.claim_proof || null
              },
              ...prev
            ];
          });
        }
      } catch (e) {
        // Backend not available; keep running smoothly
      }
    };

    const timer = setInterval(pollBroadcasts, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleToastItemClick = (toast) => {
    setSelectedChatId(toast.chatId || 'dormtrack');
    setMobileOpenChatId(toast.chatId || 'dormtrack');
    setDormTrackUnreadCount(0);
    setReadChatIds(prev => prev.includes('dormtrack') ? prev : [...prev, 'dormtrack']);
    setChatTimelineFilter(toast.filter || 'all');
    setToastList(prev => prev.filter(t => t.id !== toast.id));
  };

  const handleSelectDesktopChat = (chatId) => {
    setSelectedChatId(chatId);
    if (chatId === 'dormtrack') {
      setDormTrackUnreadCount(0);
    }
    setReadChatIds(prev => prev.includes(chatId) ? prev : [...prev, chatId]);
  };

  const handleOpenMobileChat = (chatId) => {
    setMobileOpenChatId(chatId);
    if (chatId === 'dormtrack') {
      setDormTrackUnreadCount(0);
    }
    setReadChatIds(prev => prev.includes(chatId) ? prev : [...prev, chatId]);
  };

  const isChatRead = (chatId) => {
    return readChatIds.includes(chatId) || selectedChatId === chatId || mobileOpenChatId === chatId;
  };
  
  const sigCanvas = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(320);
  const chatEndRef = useRef(null);
  const mobileChatEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      mobileChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChatId, mobileOpenChatId, chatTimelineFilter, selectedStudentIndex]);

  // Responsive signature canvas sizing
  useEffect(() => {
    const updateCanvasWidth = () => {
      if (canvasContainerRef.current) {
        const w = canvasContainerRef.current.clientWidth;
        if (w > 0) {
          setCanvasWidth(Math.max(260, Math.min(w - 24, 420)));
        }
      }
    };

    if (selectedPackage) {
      setTimeout(updateCanvasWidth, 60);
    }

    window.addEventListener('resize', updateCanvasWidth);
    return () => window.removeEventListener('resize', updateCanvasWidth);
  }, [selectedPackage]);

  // Standalone Mock Data Mode (No communication between frontend and backend)

  const announcements = [
    { 
      title: 'ช็อกซ้ำ! เจ้าไดแอนท์ สุนัขพิตบูลตัวเดิมขย้ำเจ้าของดับรายที่ 2 คาบ้านพัก', 
      tag: 'ข่าวด่วน 🔥',
      date: 'ข่าวด่วนวันนี้',
      image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'
    },
    { 
      title: 'ซองพัสดุสีขาว จ่าหน้าไม่ชัดเจน พบที่ห้องพัสดุตึก B', 
      tag: 'ประกาศหอพัก 📢',
      date: 'พบเมื่อ: 1 ก.ย. - ตึก B',
      image: 'https://images.unsplash.com/photo-1595246006456-7872d8479e08?auto=format&fit=crop&w=100&q=80'
    }
  ];

  const handleSign = async () => {
    if (sigCanvas.current.isEmpty()) {
      alert("กรุณาเซ็นชื่อก่อนยืนยันรับพัสดุ");
      return;
    }
    
    let signatureData = '';
    try {
      signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    } catch (e) {
      console.warn('Canvas export failed:', e);
    }

    const pkgId = selectedPackage.id || selectedPackage.tracking;

    // ส่งคำสั่ง PUT ไปยัง Backend API / MongoDB (FR-03 & Task 12)
    try {
      await fetch(`http://localhost:5000/api/packages/${pkgId}/receive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signature_data: signatureData,
          student_id: currentStudent.student_id || currentStudent.id
        })
      });
    } catch (err) {
      console.warn('Backend update failed:', err);
    }

    // อัปเดตสถานะของพัสดุนี้เป็น 'รับแล้ว' ใน Student UI
    setStudentList(prev => {
      const nextList = [...prev];
      const curPkgs = nextList[selectedStudentIndex].packages.map(p => 
        (p.id === pkgId || p.tracking === pkgId) ? { ...p, status: 'รับแล้ว' } : p
      );
      nextList[selectedStudentIndex] = {
        ...nextList[selectedStudentIndex],
        packages: curPkgs
      };
      return nextList;
    });

    playNotificationSound();
    pushNotification({
      id: `recv-${pkgId}-${Date.now()}`,
      sender: '📦 รับพัสดุสำเร็จ',
      time: 'เมื่อสักครู่',
      message: `ยืนยันการเซ็นรับพัสดุ ${pkgId} เรียบร้อยแล้ว ข้อมูลถูกบันทึกลงฐานข้อมูล`
    });

    setSelectedPackage(null);
  };

  const waitingCount = packages.filter(p => p.status === 'รอรับ').length;
  const pendingBroadcastCount = broadcastPackages.filter(p => p.status === 'broadcasted').length;

  // The latest waiting package (or latest package) for chat list snippet
  const primaryWaitingPackage = [...packages].reverse().find(p => p.status === 'รอรับ') || packages[packages.length - 1];

  // CHATS DEFINITION: Only 'dormtrack' has hasConfirmButton = true!
  const allChats = [
    {
      id: 'dormtrack',
      name: 'ระบบติดตามพัสดุหอพักนักศึกษา มทร. ล้านนา เชียงใหม่ (ดอยสะเก็ด)',
      avatarIcon: '📦',
      avatarBg: '#06c755',
      isOfficial: true,
      hasConfirmButton: true, // << THE ONLY CHAT THAT HAS THE CONFIRM BUTTON!
      time: primaryWaitingPackage?.arrivedAt?.includes('น.')
        ? primaryWaitingPackage.arrivedAt.split(' ').slice(-2).join(' ')
        : '15:42 น.',
      lastMsg: waitingCount > 0 
        ? `แจ้งเตือนพัสดุใหม่ ${primaryWaitingPackage?.id} รอเซ็นรับ...` 
        : 'พัสดุทั้งหมดได้รับการเซ็นรับเรียบร้อยแล้ว',
      unreadCount: dormTrackUnreadCount > 0 ? dormTrackUnreadCount : (isChatRead('dormtrack') ? 0 : 1),
    },
    {
      id: 'eng_dept',
      name: 'คณะวิศวกรรมศาสตร์ มทร.ล้านนา (1,240)',
      avatarImg: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=100&q=80',
      isOfficial: true,
      hasConfirmButton: false,
      time: '15:39 น.',
      lastMsg: 'งานกิจการนักศึกษา: ประกาศกำหนดการตรวจสุขภาพประจำปี...',
      unreadCount: 112,
      messages: [
        { sender: 'other', text: 'ประกาศ: งานกิจการนักศึกษาแจ้งกำหนดการตรวจสุขภาพประจำปี ขอให้นักศึกษาทุกคนลงทะเบียนตามวันและเวลาที่กำหนด', time: '15:39 น.' }
      ]
    },
    {
      id: 'dorm_office',
      name: 'หอพักนักศึกษา มทร.ล้านนา (131)',
      avatarIcon: '🏢',
      avatarBg: '#8b0000',
      isOfficial: true,
      hasConfirmButton: false,
      time: '15:04 น.',
      lastMsg: 'แม่บ้าน: วันนี้มีเจ้าหน้าที่เข้ามาตรวจเช็คระบบอินเทอร์เน็ต...',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: 'ประกาศ: วันนี้มีเจ้าหน้าที่เข้ามาตรวจเช็คระบบอินเทอร์เน็ตประจำตึก B เวลา 09:00 - 12:00 น.', time: '15:04 น.' },
      ]
    },
    {
      id: 'dorm_affairs',
      name: 'งานวินัยและสวัสดิการ หอพัก มทร.ล้านนา',
      avatarIcon: '🏠',
      avatarBg: '#2d3748',
      isOfficial: false,
      hasConfirmButton: false,
      time: '14:26 น.',
      lastMsg: 'แจ้งเตือน: ตรวจความเรียบร้อยและสุขอนามัยภายในห้องพัก...',
      unreadCount: 7,
      messages: [
        { sender: 'other', text: 'แจ้งเตือน: ช่วงสัปดาห์นี้จะมีการเดินตรวจความเรียบร้อยตามระเบียบหอพัก ขอให้นักศึกษาช่วยดูแลความสะอาดด้วยครับ', time: '14:26 น.' }
      ]
    },
    {
      id: 'line_shopping',
      name: 'LINE SHOPPING',
      avatarIcon: '🛍️',
      avatarBg: '#06c755',
      isOfficial: true,
      hasConfirmButton: false,
      time: '14:00 น.',
      lastMsg: '🎉 แจกโค้ดส่วนลด 100 บาท ช้อปโอปป้าสุดคุ้ม...',
      unreadCount: 65,
      messages: [
        { sender: 'other', text: '🎉 ดีลพิเศษสำหรับคุณวันนี้! รับคูปองส่วนลดสูงสุด 100 บาทเมื่อช้อปครบ 500 บาท', time: '14:00 น.' }
      ]
    },
    {
      id: 'line_stickers',
      name: 'LINE STICKERS',
      avatarIcon: '🐻',
      avatarBg: '#ff9800',
      isOfficial: true,
      hasConfirmButton: false,
      time: '13:47 น.',
      lastMsg: '✨ ใหม่! สติกเกอร์น้องหมี มทร. ส่งความสุขถึงเพื่อนๆ...',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: '✨ สติกเกอร์ใหม่มาแล้ว ดาวน์โหลดได้ที่ Sticker Shop เลยวันนี้ 🐻', time: '13:47 น.' }
      ]
    },
    {
      id: 'ee_dept',
      name: 'Dept. of EE. RMUTL (1,681)',
      avatarIcon: '🐣',
      avatarBg: '#ffeb3b',
      isOfficial: true,
      hasConfirmButton: false,
      time: '13:05 น.',
      lastMsg: 'อาจารย์: แจ้งเลื่อนคลาสเรียนและส่งรายงานโปรเจกต์...',
      unreadCount: '999+',
      messages: [
        { sender: 'other', text: 'อาจารย์: สัปดาห์หน้าจะมีการส่งรายงานความคืบหน้ารอบที่ 1 ตรวจสอบกำหนดการใน MS Teams ด้วยครับ', time: '13:05 น.' }
      ]
    },
    {
      id: 'dorm_connext',
      name: 'Dorm Connext (ข่าวสารหอพัก)',
      avatarIcon: '🦅',
      avatarBg: '#1a202c',
      isOfficial: false,
      hasConfirmButton: false,
      time: '12:33 น.',
      lastMsg: 'สรุปผลกิจกรรมปฐมนิเทศนักศึกษาหอพักปีการศึกษา 2568',
      unreadCount: 0,
      messages: [
        { sender: 'other', text: 'ภาพบรรยากาศและสรุปผลกิจกรรมปฐมนิเทศนักศึกษาหอพัก เข้าดูได้ที่ระบบเว็บพอร์ทัล', time: '12:33 น.' }
      ]
    }
  ];

  // Filter chats by search or tab
  const filteredChats = allChats.filter(chat => {
    if (activeTab === 'waiting' && chat.id !== 'dormtrack') return false;
    if (activeTab === 'done' && (chat.id !== 'dormtrack' || waitingCount > 0)) return false;
    if (activeTab === 'official' && !chat.isOfficial) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return chat.name.toLowerCase().includes(q) || chat.lastMsg.toLowerCase().includes(q);
    }
    return true;
  });

  // Current active chat on Desktop
  const currentDesktopChat = allChats.find(c => c.id === selectedChatId) || allChats[0];

  // Current active chat on Mobile
  const currentMobileChat = allChats.find(c => c.id === mobileOpenChatId) || null;

  // ฟังก์ชันแปลงข้อความวันที่และเวลา (ทั้งแบบ พ.ศ., ค.ศ., และคำกำกับ) เป็น Timestamp (ms) เพื่อจัดเรียงลำดับเวลาให้ถูกต้องแม่นยำ
  const parseTimelineTime = (timeStr, rawDate) => {
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) return d.getTime();
    }
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const s = timeStr.trim();
    if (s.includes('เมื่อสักครู่')) return Date.now() + 1000;
    
    // รูปแบบ "dd/mm/yyyy hh:mm:ss" หรือ "dd/mm/yyyy, hh:mm:ss" (เช่น จาก toLocaleString('th-TH'))
    const slashMatch = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[,\s]+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (slashMatch) {
      let day = parseInt(slashMatch[1], 10);
      let month = parseInt(slashMatch[2], 10) - 1;
      let year = parseInt(slashMatch[3], 10);
      if (year > 2400) year -= 543; // แปลงปี พ.ศ. เป็น ค.ศ.
      let hour = parseInt(slashMatch[4], 10);
      let min = parseInt(slashMatch[5], 10);
      let sec = slashMatch[6] ? parseInt(slashMatch[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec).getTime();
    }

    // รูปแบบวันที่ไทย เช่น "1 ก.ย. 2569 14:30" หรือ "31 ส.ค. 2569 16:45"
    const thaiMonths = {
      'ม.ค.': 0, 'ก.พ.': 1, 'มี.ค.': 2, 'เม.ย.': 3, 'พ.ค.': 4, 'มิ.ย.': 5,
      'ก.ค.': 6, 'ส.ค.': 7, 'ก.ย.': 8, 'ต.ค.': 9, 'พ.ย.': 10, 'ธ.ค.': 11
    };
    const thMatch = s.match(/(\d{1,2})\s+([ก-๙\.]+)\s+(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
    if (thMatch) {
      let day = parseInt(thMatch[1], 10);
      let mStr = thMatch[2];
      let month = thaiMonths[mStr] !== undefined ? thaiMonths[mStr] : 0;
      let year = parseInt(thMatch[3], 10);
      if (year > 2400) year -= 543;
      let hour = thMatch[4] ? parseInt(thMatch[4], 10) : 12;
      let min = thMatch[5] ? parseInt(thMatch[5], 10) : 0;
      let sec = thMatch[6] ? parseInt(thMatch[6], 10) : 0;
      return new Date(year, month, day, hour, min, sec).getTime();
    }

    if (s.includes('วันนี้')) return Date.now() - 3600000;
    if (s.includes('เมื่อวาน')) return Date.now() - 86400000;
    if (s.includes('2 วันก่อน')) return Date.now() - 172800000;

    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.getTime();
    return 0;
  };

  // ผู้ช่วยจัดรูปแบบการแสดงผลวันที่บน Date Divider
  const formatDateDivider = (timeStr) => {
    if (!timeStr) return 'วันนี้';
    const slashMatch = timeStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
      const day = slashMatch[1];
      const monthIndex = parseInt(slashMatch[2], 10) - 1;
      const year = slashMatch[3];
      const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${day} ${monthNames[monthIndex] || 'ก.ย.'} ${year}`;
    }
    return timeStr.split(' ').slice(0, 3).join(' ');
  };

  // ผู้ช่วยจัดรูปแบบเวลาใน Bubble แชท (เช่น 14:30 น.)
  const formatBubbleTime = (timeStr) => {
    if (!timeStr) return '12:00 น.';
    if (timeStr.includes('น.')) return timeStr.split(' ').slice(-2).join(' ');
    const m = timeStr.match(/(\d{1,2}:\d{2})(?::\d{2})?/);
    if (m) return `${m[1]} น.`;
    return timeStr;
  };

  // จัดเรียงตามลำดับเวลาห้องแชทมาตรฐาน (ข้อความเก่าสุดอยู่ด้านบน -> ข้อความล่าสุดอยู่ล่างสุดเสมอ)
  const personalTimelineItems = packages.map((pkg, idx) => ({
    type: 'personal',
    id: pkg.id || `personal-${idx}`,
    timeWeight: parseTimelineTime(pkg.arrivedAt, pkg.arrival_date || pkg.createdAt),
    pkg: pkg
  })).sort((a, b) => a.timeWeight - b.timeWeight);

  const broadcastTimelineItems = broadcastPackages.map((bpkg, idx) => ({
    type: 'broadcast',
    id: bpkg.id || bpkg.tracking || `broadcast-${idx}`,
    timeWeight: parseTimelineTime(bpkg.broadcastAt, bpkg.broadcast_at || bpkg.createdAt),
    bpkg: bpkg
  })).sort((a, b) => a.timeWeight - b.timeWeight);

  let timelineItems = [];
  if (chatTimelineFilter === 'personal') {
    timelineItems = personalTimelineItems;
  } else if (chatTimelineFilter === 'broadcast') {
    timelineItems = broadcastTimelineItems;
  } else {
    // 'all': รวมแชทพัสดุทั้งหมด ทั้งพัสดุส่วนตัวและประกาศพัสดุไม่ทราบชื่อ เรียงตามลำดับเวลาในห้องแชท (เก่าสุดอยู่บน -> ใหม่สุดอยู่ล่าง)
    timelineItems = [...personalTimelineItems, ...broadcastTimelineItems].sort((a, b) => a.timeWeight - b.timeWeight);
  }

  // เลื่อนหน้าจอแชทลงสู่ข้อความล่าสุด (ด้านล่างสุด) อัตโนมัติเสมอเมื่อมีพัสดุใหม่เข้าสู่ไทม์ไลน์
  useEffect(() => {
    scrollToBottom();
  }, [timelineItems.length]);

  return (
    <div className={`app-root mode-${viewMode}`}>
      {/* ========================================================= */}
      {/* RESPONSIVE SWITCHER BAR (แถบช่วยสลับโหมดทดสอบด้านบน) */}
      {/* ========================================================= */}
      <div className="responsive-switcher-bar">
        <div className="switcher-content">
          {/* Title / Brand Badge */}
          <div className="system-title-badge" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '12.5px', fontWeight: 700 }}>
            <span style={{ fontSize: '16px' }}>📦</span>
            <span>ระบบติดตามพัสดุหอพักนักศึกษา (มทร. ล้านนา)</span>
          </div>

          {/* Student Profile Switcher (สำหรับทดสอบหลายคนร่วมกัน) */}
          <div className="student-profile-switcher">
            <span className="profile-label">👤 ผู้ใช้งานปัจจุบัน:</span>
            <select 
              className="student-select"
              value={selectedStudentIndex}
              onChange={(e) => handleChangeStudent(Number(e.target.value))}
              title="สลับบัญชีนักศึกษาเพื่อทดสอบว่าแต่ละคนเห็น Broadcast และแชทพัสดุต่างกันอย่างไร"
            >
              {studentList.map((st, idx) => (
                <option key={st.id} value={idx}>
                  {st.name} ({st.room})
                </option>
              ))}
            </select>
          </div>

          <div className="switcher-group">
            <span className="switcher-label">มุมมอง UI:</span>
            <div className="switcher-buttons">
              <button 
                className={`switch-btn ${viewMode === 'auto' ? 'active' : ''}`} 
                onClick={() => setViewMode('auto')}
                title="ปรับขนาดตามหน้าจอจริงอัตโนมัติ"
              >
                🔄 อัตโนมัติ (Responsive)
              </button>
              <button 
                className={`switch-btn ${viewMode === 'desktop' ? 'active' : ''}`} 
                onClick={() => setViewMode('desktop')}
                title="เปิดมุมมอง LINE Desktop (PC)"
              >
                💻 LINE PC (Desktop)
              </button>
              <button 
                className={`switch-btn ${viewMode === 'mobile' ? 'active' : ''}`} 
                onClick={() => setViewMode('mobile')}
                title="เปิดมุมมอง LINE Mobile (จำลองมือถือ)"
              >
                📱 LINE Mobile
              </button>
            </div>
          </div>

          <div className="mobile-lan-hint" title="เปิดทดสอบบนมือถือจริงผ่าน Wi-Fi เดียวกัน">
            <span>🌐 Wi-Fi LAN:</span>
            <code>http://192.168.1.2:5173/</code>
          </div>
        </div>
      </div>

      {/* Real-time Stacked Toast Notifications (แจ้งเตือนแบบ stack ตาม Task) */}
      <div className="line-toast-stack-container">
        {toastList.map((toast) => (
          <div 
            key={toast.id}
            className="line-notification-toast"
            onClick={() => handleToastItemClick(toast)}
            title="คลิกเพื่อเปิดดูห้องแชทพัสดุ"
          >
            <div className="toast-icon">
              {toast.sender.includes('📢') || toast.sender.includes('ประกาศ') ? '📢' : toast.sender.includes('👤') ? '👤' : toast.sender.includes('⚙️') ? '⚙️' : '📦'}
            </div>
            <div className="toast-content">
              <div className="toast-title-row">
                <strong>{toast.title}</strong>
                <span className="toast-time">{toast.time}</span>
              </div>
              <p className="toast-body">{toast.message}</p>
              <span className="toast-hint">👉 คลิกเพื่อเปิดแชทและดูรายละเอียด</span>
            </div>
            <button 
              className="toast-close" 
              onClick={(e) => { e.stopPropagation(); setToastList(prev => prev.filter(t => t.id !== toast.id)); }}
              title="ปิด"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* LINE DESKTOP (PC VERSION) - เหมือนรูปตัวอย่าง media_1789030719313 */}
      {/* ========================================================= */}
      <div className="line-pc-app desktop-only">
        
        {/* COLUMN 1: LEFT ICON SIDEBAR (แถบไอคอนซ้ายสุด 64px) */}
        <aside className="line-pc-sidebar">
          <div className="sidebar-top">
            <div className="user-avatar-wrap" title={student?.name || 'สมชาย ดีใจ'}>
              <img src={student?.profileImage || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80"} alt="Avatar" className="user-avatar" />
              <span className="online-indicator"></span>
            </div>
            
            <button 
              className="sidebar-btn active" 
              title="แชท (Chats)"
              onClick={() => {
                setSelectedChatId('dormtrack');
                setChatTimelineFilter('all');
                scrollToBottom();
              }}
            >
              <span className="sidebar-icon">💬</span>
              {waitingCount > 0 && <span className="sidebar-badge">{waitingCount}</span>}
            </button>

            <button className="sidebar-btn" title="เพื่อน (Friends)">
              <span className="sidebar-icon">👥</span>
            </button>

            <button className="sidebar-btn" title="VOOM">
              <span className="sidebar-icon">🧭</span>
            </button>

            <button className="sidebar-btn" title="LINE Call">
              <span className="sidebar-icon">📞</span>
            </button>
            
            <button className="sidebar-btn" title="Keep / บันทึก">
              <span className="sidebar-icon">📁</span>
            </button>
          </div>

          <div className="sidebar-bottom">
            <button className="sidebar-btn" title="การแจ้งเตือน">
              <span className="sidebar-icon">🔔</span>
            </button>
            <button className="sidebar-btn" title="ตั้งค่า (Settings)">
              <span className="sidebar-icon">⚙️</span>
            </button>
          </div>
        </aside>

        {/* COLUMN 2: MIDDLE CHATS LIST (~320px) */}
        <section className="line-pc-chatlist">
          {/* Top Filter Tabs */}
          <div className="pc-chatlist-tabs">
            <button className={activeTab === 'all' ? 'active' : ''} onClick={() => setActiveTab('all')}>ทั้งหมด</button>
            <button className={activeTab === 'waiting' ? 'active' : ''} onClick={() => setActiveTab('waiting')}>
              รอรับ {waitingCount > 0 && `(${waitingCount})`}
            </button>
            <button className={activeTab === 'done' ? 'active' : ''} onClick={() => setActiveTab('done')}>รับแล้ว</button>
            <button className={activeTab === 'official' ? 'active' : ''} onClick={() => setActiveTab('official')}>บัญชีทางการ</button>
            <button className="tab-settings-icon" title="ตัวกรอง">☰</button>
          </div>

          {/* Search Bar */}
          <div className="pc-search-wrap">
            <div className="pc-search-box">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="ค้นหาข้อความและห้องแชท" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="sort-icon" title="จัดเรียง">⇅</span>
            </div>
          </div>

          {/* Quick Banner to jump to Broadcast in Chat */}
          <div 
            className="line-broadcast-quick-card"
            onClick={() => {
              setSelectedChatId('dormtrack');
              setChatTimelineFilter('broadcast');
              scrollToBottom();
            }}
            title="คลิกเพื่อดูประกาศพัสดุที่ไม่ทราบชื่อในห้องแชทนี้"
          >
            <div className="quick-card-left">
              <span className="quick-card-icon">📢</span>
              <div className="quick-card-info">
                <h5>ประกาศพัสดุไม่ทราบชื่อ</h5>
                <p>{pendingBroadcastCount} รายการประกาศหาเจ้าของ</p>
              </div>
            </div>
            <span className="quick-card-btn">เปิดดูในแชท ›</span>
          </div>

          {/* Chat Items List */}
          <div className="pc-chat-items-scroll">
                {filteredChats.map((chat) => (
                  <div 
                    className={`pc-chat-item ${selectedChatId === chat.id ? 'active' : ''}`}
                    key={chat.id}
                    onClick={() => handleSelectDesktopChat(chat.id)}
                  >
                    <div className="chat-avatar-wrap">
                      {chat.avatarImg ? (
                        <img src={chat.avatarImg} alt={chat.name} className="pc-avatar" />
                      ) : (
                        <div className={`pc-avatar ${chat.id === 'dormtrack' ? 'official-bot' : 'neutral-icon'}`}>
                          {chat.avatarIcon}
                        </div>
                      )}
                      {chat.isOfficial && <span className="pc-check-badge">✓</span>}
                      {chat.id === 'dormtrack' && dormTrackUnreadCount > 0 && <span className="pc-green-dot"></span>}
                    </div>
                    
                    <div className="chat-item-info">
                      <div className="chat-item-header">
                        <span className="chat-name">{chat.name}</span>
                        <span className="chat-time">{chat.time}</span>
                      </div>
                      <div className="chat-item-desc">
                        <p className="last-msg">{chat.lastMsg}</p>
                        {chat.unreadCount > 0 ? (
                          <span className="pc-unread-badge">{chat.unreadCount}</span>
                        ) : chat.id === 'dormtrack' && waitingCount === 0 ? (
                          <span className="pc-done-check">✓</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredChats.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px 10px', color: '#777', fontSize: '12px' }}>
                    ไม่พบห้องแชทที่ค้นหา
                  </div>
                )}
              </div>

          {/* Bottom Ad / Promotion Banner */}
          <div className="pc-bottom-promo">
            <div className="promo-text">
              <small>LINE Official Account</small>
              <p>ระบบแจ้งเตือนพัสดุหอพัก อัตโนมัติ 24 ชม.</p>
            </div>
            <span className="promo-tag">Dorm</span>
          </div>
        </section>

        {/* COLUMN 3: RIGHT CHAT CONVERSATION AREA */}
        <section className="line-pc-chatroom">
          {/* Top Chatroom Header */}
          <div className="pc-chatroom-header">
            <div className="chatroom-header-left">
              {currentDesktopChat.isOfficial && <span className="header-verified-icon">✓</span>}
              <h2>{currentDesktopChat.name}</h2>
              {currentDesktopChat.isOfficial && <span className="header-megaphone" title="ประกาศ">📢</span>}
            </div>
            
            <div className="chatroom-header-right">
              <button className="header-tool-btn" title="ค้นหาในแชท">🔍</button>
              <button className="header-tool-btn" title="โทรเสียง">📞</button>
              <button className="header-tool-btn" title="ปักหมุด">📌</button>
              <button className="header-tool-btn" title="เมนู">☰</button>
              <div className="window-controls">
                <button className="win-btn" title="ย่อ">−</button>
                <button className="win-btn" title="ขยาย">□</button>
                <button className="win-btn win-close" title="ปิด">×</button>
              </div>
            </div>
          </div>

          {/* Chat Messages Timeline */}
          <div className="pc-chatroom-body">
            
            {/* ============================================================= */}
            {/* CASE 1: DORMTRACK CONNECT - CHAT เดียวที่มีปุ่มกดยืนยันสินค้า!   */}
            {/* ============================================================= */}
            {currentDesktopChat.hasConfirmButton ? (
              <>
                {/* Top Promotion / Rich Banner Card */}
                <div className="pc-rich-banner">
                  <div className="rich-banner-col banner-blue">
                    <div className="banner-badge">Dorm Track</div>
                    <h3>รับพัสดุได้เร็ว <span>สะดวก ปลอดภัย</span></h3>
                    <button className="banner-sub-btn">รายละเอียด</button>
                  </div>
                  <div className="rich-banner-col banner-pink">
                    <div className="banner-badge">ห้องพัสดุตึก B</div>
                    <h3>เปิดบริการ <span>08:30 - 18:00</span> น.</h3>
                    <button className="banner-sub-btn">ตารางเวลา</button>
                  </div>
                </div>
                {/* Timeline Filter: ทั้งหมด / พัสดุของฉัน / ประกาศ Broadcast (Task 11) */}
                <ChatTimelineFilterBar 
                  filter={chatTimelineFilter}
                  setFilter={setChatTimelineFilter}
                  myCount={packages.length}
                  broadcastCount={broadcastPackages.length}
                />

                {/* Render Unified Timeline Items (ทั้งหมด / พัสดุของฉัน / ประกาศหาเจ้าของ) */}
                {timelineItems.map((item) => {
                  if (item.type === 'personal') {
                    const pkg = item.pkg;
                    return (
                      <div key={pkg.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div className="pc-time-divider">
                          {formatDateDivider(pkg.arrivedAt)}
                        </div>

                        {/* Official Slip Notification Bubble */}
                        <div className="pc-msg-bubble-wrap">
                          <div className="pc-sender-avatar-official">
                            <span className="kbank-brand-icon">📦</span>
                            <span className="kbank-sub">DORM</span>
                          </div>
                          
                          <div className="pc-bubble-column">
                            {/* CRISP WHITE CARD BUBBLE */}
                            <div className="line-white-card-bubble pc-white-card-override">
                              <div className="card-top-header">
                                <div className="card-brand-title">
                                  <span className="card-pkg-icon">📬</span>
                                  <h4>แจ้งเตือนพัสดุ</h4>
                                </div>
                                <span className={`line-card-status-badge ${pkg.status === 'รอรับ' ? 'status-waiting' : 'status-done'}`}>
                                  {pkg.status === 'รอรับ' ? 'รอเซ็นรับพัสดุ' : 'รับพัสดุแล้ว'}
                                </span>
                              </div>

                              <div className="card-inner-divider"></div>

                              {/* รูปพัสดุ */}
                              {pkg.image && (
                                <div className="card-pkg-image-box">
                                  <img src={pkg.image} alt="พัสดุ" />
                                </div>
                              )}

                              <div className="card-details-table">
                                <div className="card-detail-line">
                                  <span className="label">ประเภท</span>
                                  <span className="val">พัสดุลงทะเบียน / กล่องพัสดุ</span>
                                </div>
                                <div className="card-detail-line">
                                  <span className="label">เลขพัสดุ</span>
                                  <span className="val tracking-code">{pkg.id}</span>
                                </div>
                                <div className="card-detail-line">
                                  <span className="label">จากผู้ส่ง</span>
                                  <span className="val">{pkg.sender}</span>
                                </div>
                                <div className="card-detail-line">
                                  <span className="label">ผู้รับ</span>
                                  <span className="val">{student?.name} ({student?.room || 'หอพักนักศึกษา'})</span>
                                </div>
                                <div className="card-detail-line">
                                  <span className="label">จุดรับพัสดุ</span>
                                  <span className="val">ห้องพัสดุตึก B</span>
                                </div>
                                <div className="card-detail-line">
                                  <span className="label">เวลาที่มาถึง</span>
                                  <span className="val">{pkg.arrivedAt}</span>
                                </div>
                              </div>

                              {/* ACTION BUTTON */}
                              <div className="card-action-container">
                                {pkg.status === 'รอรับ' ? (
                                  <button 
                                    className="line-official-green-btn"
                                    onClick={() => setSelectedPackage(pkg)}
                                  >
                                    ปุ่มเซ็นรับพัสดุ
                                  </button>
                                ) : (
                                  <div className="line-official-signed-state">
                                    <span className="check-mark">✓</span> เซ็นรับพัสดุเรียบร้อยแล้ว
                                  </div>
                                )}
                              </div>
                            </div>

                            <span className="bubble-timestamp">
                              {formatBubbleTime(pkg.arrivedAt)}
                            </span>
                          </div>
                        </div>

                        {/* Messages when signed */}
                        {pkg.status === 'รับแล้ว' && (
                          <>
                            <div className="pc-user-reply-wrap">
                              <span className="user-reply-time">
                                {formatBubbleTime(pkg.arrivedAt)}
                              </span>
                              <div className="pc-user-green-bubble">
                                ยืนยันการรับพัสดุ {pkg.id} เรียบร้อยแล้วครับ ✅
                              </div>
                            </div>

                            <div className="pc-msg-bubble-wrap" style={{ marginTop: '2px' }}>
                              <div className="pc-sender-avatar-official">
                                <span className="kbank-brand-icon">📦</span>
                                <span className="kbank-sub">DORM</span>
                              </div>
                              <div className="pc-bubble-column">
                                <div className="line-text-dark-bubble" style={{ maxWidth: '320px' }}>
                                  นักศึกษาได้เซ็นรับพัสดุ <b>{pkg.id}</b> เรียบร้อยแล้ว ขอบคุณที่มาติดต่อรับพัสดุครับ 📦✨
                                </div>
                                <span className="bubble-timestamp">เมื่อสักครู่</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  } else {
                    return (
                      <BroadcastChatCard 
                        key={item.bpkg.id || item.bpkg.tracking}
                        bpkg={item.bpkg}
                        currentStudent={currentStudent}
                        onClaim={(pkg) => setClaimModalPackage(pkg)}
                        isMobile={false}
                      />
                    );
                  }
                })}

                <div ref={chatEndRef} />
              </>
            ) : (
              /* ============================================================= */
              /* CASE 2: CHAT อื่นๆ ทั้งหมด - เป็นแชทพูดคุยทั่วไป ไม่มีปุ่มยืนยัน! */
              /* ============================================================= */
              <div className="pc-normal-chat-timeline">
                <div className="pc-time-divider">วันนี้</div>
                
                {currentDesktopChat.messages && currentDesktopChat.messages.map((m, idx) => (
                  <div 
                    key={idx} 
                    className={`pc-chat-msg-row ${m.sender === 'me' ? 'my-msg' : ''}`}
                  >
                    {m.sender !== 'me' && (
                      <div className="pc-normal-sender-avatar">
                        {currentDesktopChat.avatarImg ? (
                          <img src={currentDesktopChat.avatarImg} alt="avatar" />
                        ) : (
                          <span>{currentDesktopChat.avatarIcon}</span>
                        )}
                      </div>
                    )}
                    
                    <div className="pc-msg-bubble">
                      {m.text}
                    </div>
                    
                    <div className="pc-msg-meta">
                      <span>{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

          {/* Chatroom Footer Input Bar */}
          <div className="pc-chatroom-footer">
            <div className="footer-toolbar">
              <button className="tool-icon" title="ไฟล์แนบ">📎</button>
              <button className="tool-icon" title="สติกเกอร์">😀</button>
              <button className="tool-icon" title="จับภาพหน้าจอ">✂️</button>
              <button className="tool-icon" title="ส่งรูป">🖼️</button>
            </div>
            
            <div className="footer-input-area">
              <textarea placeholder="พิมพ์ข้อความ..."></textarea>
              <button className="pc-send-btn">ส่ง</button>
            </div>
          </div>

        </section>
      </div>

      {/* ========================================================= */}
      {/* MOBILE VIEW: LINE CHATS DASHBOARD / CHAT ROOM (SCREEN 1 & 2) */}
      {/* ========================================================= */}
      <div className="line-mobile-wrapper mobile-only">
        {currentMobileChat ? (
          /* --------------------------------------------------------- */
          /* SCREEN 2: MOBILE CHAT ROOM (MATCHING IMAGE 2)             */
          /* --------------------------------------------------------- */
          <div className="line-chat-screen-mobile">
            {/* Header (Matching Image 2) */}
            <div className="line-header">
              <button 
                className="line-back-btn" 
                onClick={() => setMobileOpenChatId(null)}
                title="ย้อนกลับไปหน้ารวมแชท"
              >
                ‹
              </button>

              <div className="line-profile-info-official">
                <div className="official-avatar-header">
                  {currentMobileChat.id === 'dormtrack' ? (
                    <span className="official-header-icon">📦</span>
                  ) : currentMobileChat.avatarIcon ? (
                    <span>{currentMobileChat.avatarIcon}</span>
                  ) : (
                    <span>💬</span>
                  )}
                </div>
                <div className="line-header-title">
                  <span className="line-name">{currentMobileChat.name}</span>
                  {currentMobileChat.isOfficial && <span className="line-verified-badge">✓</span>}
                </div>
              </div>
              
              <div className="line-header-actions">
                <button className="line-icon-btn" title="ค้นหา">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </button>
                <button className="line-icon-btn" title="โน้ต / บันทึก">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="3" width="16" height="18" rx="2"/>
                    <line x1="8" y1="8" x2="16" y2="8"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                    <line x1="8" y1="16" x2="13" y2="16"/>
                  </svg>
                </button>
                <button className="line-icon-btn relative-icon" title="เมนูเพิ่มเติม">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <line x1="3" y1="12" x2="21" y2="12"/>
                    <line x1="3" y1="18" x2="21" y2="18"/>
                  </svg>
                  <span className="menu-green-dot"></span>
                </button>
              </div>
            </div>

            {/* Chat Body (Matching Image 2) */}
            <div className="line-chat-body">
              {currentMobileChat.hasConfirmButton ? (
                <>
                  {/* Timeline Filter Pills for Mobile */}
                  <ChatTimelineFilterBar 
                    filter={chatTimelineFilter}
                    setFilter={setChatTimelineFilter}
                    myCount={packages.length}
                    broadcastCount={broadcastPackages.length}
                  />

                  {/* Render Unified Timeline Items (ทั้งหมด / พัสดุของฉัน / ประกาศหาเจ้าของ) */}
                  {timelineItems.map((item) => {
                    if (item.type === 'personal') {
                      const pkg = item.pkg;
                      return (
                        <Fragment key={pkg.id}>
                          <div className="line-date-divider-clean">
                            <span>{formatDateDivider(pkg.arrivedAt)}</span>
                          </div>

                          <div className="line-msg-row-official">
                            <div className="line-official-avatar-col">
                              <div className="line-official-avatar-bubble">
                                <span className="kbank-brand-icon">📦</span>
                                <span className="kbank-sub">DORM</span>
                              </div>
                            </div>
                            
                            <div className="line-msg-content-official">
                              {/* CRISP WHITE CARD BUBBLE (Image 2) */}
                              <div className="line-white-card-bubble">
                                <div className="card-top-header">
                                  <div className="card-brand-title">
                                    <span className="card-pkg-icon">📬</span>
                                    <h4>แจ้งเตือนพัสดุ</h4>
                                  </div>
                                  <span className={`line-card-status-badge ${pkg.status === 'รอรับ' ? 'status-waiting' : 'status-done'}`}>
                                    {pkg.status === 'รอรับ' ? 'รอเซ็นรับพัสดุ' : 'รับพัสดุแล้ว'}
                                  </span>
                                </div>

                                <div className="card-inner-divider"></div>

                                {/* รูปพัสดุ */}
                                {pkg.image && (
                                  <div className="card-pkg-image-box">
                                    <img src={pkg.image} alt="พัสดุ" />
                                  </div>
                                )}

                                <div className="card-details-table">
                                  <div className="card-detail-line">
                                    <span className="label">ประเภท</span>
                                    <span className="val">พัสดุลงทะเบียน / กล่องพัสดุ</span>
                                  </div>
                                  <div className="card-detail-line">
                                    <span className="label">เลขพัสดุ</span>
                                    <span className="val tracking-code">{pkg.id}</span>
                                  </div>
                                  <div className="card-detail-line">
                                    <span className="label">จากผู้ส่ง</span>
                                    <span className="val">{pkg.sender}</span>
                                  </div>
                                  <div className="card-detail-line">
                                    <span className="label">ผู้รับ</span>
                                    <span className="val">{student?.name} ({student?.room || 'หอพักนักศึกษา'})</span>
                                  </div>
                                  <div className="card-detail-line">
                                    <span className="label">จุดรับพัสดุ</span>
                                    <span className="val">ห้องพัสดุตึก B</span>
                                  </div>
                                  <div className="card-detail-line">
                                    <span className="label">เวลาที่มาถึง</span>
                                    <span className="val">{pkg.arrivedAt}</span>
                                  </div>
                                </div>

                                {/* GREEN ACTION BUTTON (Matching Image 2: "ปุ่มเซ็นรับพัสดุ") */}
                                <div className="card-action-container">
                                  {pkg.status === 'รอรับ' ? (
                                    <button 
                                      className="line-official-green-btn"
                                      onClick={() => setSelectedPackage(pkg)}
                                    >
                                      ปุ่มเซ็นรับพัสดุ
                                    </button>
                                  ) : (
                                    <div className="line-official-signed-state">
                                      <span className="check-mark">✓</span> เซ็นรับพัสดุเรียบร้อยแล้ว
                                    </div>
                                  )}
                                </div>
                              </div>

                              <span className="line-msg-time-clean">
                                {formatBubbleTime(pkg.arrivedAt)}
                              </span>
                            </div>
                          </div>

                          {/* Messages when signed: Both User Confirmation & Official Bot Reply */}
                          {pkg.status === 'รับแล้ว' && (
                            <>
                              {/* 1. ข้อความยืนยันของนักศึกษา */}
                              <div className="line-normal-msg-row my-msg">
                                <span className="line-normal-time">เมื่อสักครู่</span>
                                <div className="line-normal-bubble" style={{ background: '#06c755', color: '#ffffff' }}>
                                  ยืนยันการรับพัสดุ {pkg.id} เรียบร้อยแล้วครับ ✅
                                </div>
                              </div>

                              {/* 2. ข้อความตอบกลับจากระบบหอพัก */}
                              <div className="line-msg-row-official" style={{ marginTop: '4px' }}>
                                <div className="line-official-avatar-col">
                                  <div className="line-official-avatar-bubble">
                                    <span className="kbank-brand-icon">📦</span>
                                    <span className="kbank-sub">DORM</span>
                                  </div>
                                </div>
                                <div className="line-msg-content-official">
                                  <div className="line-text-dark-bubble">
                                    นักศึกษาได้เซ็นรับพัสดุ <b>{pkg.id}</b> เรียบร้อยแล้ว ขอบคุณที่มาติดต่อรับพัสดุครับ 📦✨
                                  </div>
                                  <span className="line-msg-time-clean">เมื่อสักครู่</span>
                                </div>
                              </div>
                            </>
                          )}
                        </Fragment>
                      );
                    } else {
                      return (
                        <BroadcastChatCard 
                          key={item.bpkg.id || item.bpkg.tracking}
                          bpkg={item.bpkg}
                          currentStudent={currentStudent}
                          onClaim={(pkg) => setClaimModalPackage(pkg)}
                          isMobile={true}
                        />
                      );
                    }
                  })}

                  <div ref={mobileChatEndRef} />
                </>
              ) : (
                /* Regular Chat Messages for Other Chats */
                <div className="line-normal-chat-body">
                  <div className="line-date-divider-clean"><span>วันนี้</span></div>
                  {currentMobileChat.messages && currentMobileChat.messages.map((m, idx) => (
                    <div key={idx} className={`line-normal-msg-row ${m.sender === 'me' ? 'my-msg' : ''}`}>
                      <div className="line-normal-bubble">
                        {m.text}
                      </div>
                      <span className="line-normal-time">{m.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chat Room Footer (Matching Image 2: Keyboard Toggle + 'เมนู ▴') */}
            <div className="line-official-footer">
              <button 
                className="footer-keyboard-toggle-btn"
                onClick={() => setShowMobileTextInput(!showMobileTextInput)}
                title="สลับโหมดพิมพ์ข้อความ / เมนู"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="4"/>
                  <circle cx="6" cy="8" r="1" fill="currentColor"/>
                  <circle cx="10" cy="8" r="1" fill="currentColor"/>
                  <circle cx="14" cy="8" r="1" fill="currentColor"/>
                  <circle cx="18" cy="8" r="1" fill="currentColor"/>
                  <circle cx="6" cy="12" r="1" fill="currentColor"/>
                  <circle cx="10" cy="12" r="1" fill="currentColor"/>
                  <circle cx="14" cy="12" r="1" fill="currentColor"/>
                  <circle cx="18" cy="12" r="1" fill="currentColor"/>
                  <line x1="8" y1="16" x2="16" y2="16"/>
                </svg>
              </button>

              {showMobileTextInput ? (
                <div className="footer-inline-input">
                  <input type="text" placeholder="พิมพ์ข้อความ..." autoFocus />
                  <button className="footer-send-btn" onClick={() => setShowMobileTextInput(false)}>ส่ง</button>
                </div>
              ) : (
                <div 
                  className="footer-menu-toggle-btn"
                  onClick={() => setShowMobileTextInput(true)}
                  title="คลิกเพื่อสลับแป้นพิมพ์"
                >
                  <span>เมนู</span>
                  <span className="triangle-arrow">▲</span>
                </div>
              )}
            </div>

            <div className="phone-home-bar"><div className="home-line"></div></div>
          </div>
        ) : (
          /* --------------------------------------------------------- */
          /* SCREEN 1: CHATS DASHBOARD (MATCHING IMAGE 1)              */
          /* --------------------------------------------------------- */
          <div className="line-dashboard-mobile">
            {/* LINE Chats Top Header (Image 1: "แชท" + 4 icons) */}
            <div className="line-chats-header">
              <div className="line-chats-title">
                <h1>แชท</h1>
              </div>
              <div className="line-chats-actions">
                <button className="line-action-icon" title="กล่องข้อความ / จัดการแชท">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <path d="M3 9h18"/>
                    <path d="M9 14l3 3 3-3"/>
                  </svg>
                </button>
                <button className="line-action-icon" title="กล้อง">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </button>
                <button className="line-action-icon" title="สร้างแชทใหม่">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    <line x1="12" y1="8" x2="12" y2="14"/>
                    <line x1="9" y1="11" x2="15" y2="11"/>
                  </svg>
                </button>
                <button className="line-action-icon" title="ตัวเลือกเพิ่มเติม">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="5" r="1.8"/>
                    <circle cx="12" cy="12" r="1.8"/>
                    <circle cx="12" cy="19" r="1.8"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable list area */}
            <div className="line-dashboard-content">
              {/* LINE Search Box (Image 1: "ค้นหา" + scanner) */}
              <div className="line-search-wrap">
                <div className="line-search-box">
                  <span className="search-icon">🔍</span>
                  <input 
                    type="text" 
                    placeholder="ค้นหา" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="qr-scan-icon" title="สแกน QR">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                      <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                      <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                      <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                      <rect x="7" y="7" width="10" height="10" rx="1"/>
                    </svg>
                  </span>
                </div>
              </div>

              {/* LINE News/Announcement Banner Card (Matching Image 1) */}
              {showBanner && announcements.length > 0 && (
                <div className="line-banner-card-dark">
                  <div className="line-banner-text-dark">
                    <h4>{announcements[0].title}</h4>
                    <span className="banner-tag-badge">{announcements[0].tag || 'ข่าวด่วน 🔥'}</span>
                  </div>
                  <img src={announcements[0].image} alt="News thumbnail" className="line-banner-thumb" />
                  <button className="line-banner-close-dark" onClick={() => setShowBanner(false)} title="ปิด">⊘</button>
                </div>
              )}

              {/* Quick Banner to jump to Task 11 Broadcast in Chat */}
              <div 
                className="line-broadcast-quick-card"
                onClick={() => {
                  handleOpenMobileChat('dormtrack');
                  setChatTimelineFilter('broadcast');
                }}
                title="คลิกเพื่อดูประกาศพัสดุที่ไม่ทราบชื่อในห้องแชทนี้"
              >
                <div className="quick-card-left">
                  <span className="quick-card-icon">📢</span>
                  <div className="quick-card-info">
                    <h5>ประกาศพัสดุไม่ทราบชื่อ</h5>
                    <p>มี {pendingBroadcastCount} รายการประกาศหาเจ้าของ</p>
                  </div>
                </div>
                <span className="quick-card-btn">เปิดดูในแชท ›</span>
              </div>

              {/* Quick Filter Tabs */}
              <div className="line-quick-tabs">
                <button 
                  className={activeTab === 'all' ? 'line-tab-btn active' : 'line-tab-btn'} 
                  onClick={() => setActiveTab('all')}
                >
                  แชททั้งหมด ({allChats.length})
                </button>
                <button 
                  className={activeTab === 'waiting' ? 'line-tab-btn active' : 'line-tab-btn'} 
                  onClick={() => setActiveTab('waiting')}
                >
                  รอรับของ ({waitingCount})
                </button>
                <button 
                  className={activeTab === 'official' ? 'line-tab-btn active' : 'line-tab-btn'} 
                  onClick={() => setActiveTab('official')}
                >
                  บัญชีทางการ
                </button>
              </div>

              {/* LINE Chat Rows List (Matching Image 1 with Green Badges) */}
              <div className="line-chat-list">
                {filteredChats.map((chat) => (
                  <div 
                    className="line-chat-item-dark" 
                    key={chat.id}
                    onClick={() => handleOpenMobileChat(chat.id)}
                  >
                    <div className="line-avatar-wrap">
                      {chat.avatarImg ? (
                        <img src={chat.avatarImg} alt={chat.name} className="line-chat-avatar" />
                      ) : (
                        <div 
                          className="line-chat-avatar official-icon-bg"
                          style={{ backgroundColor: chat.avatarBg || (chat.id === 'dormtrack' ? '#06c755' : '#2d3748') }}
                        >
                          {chat.avatarIcon}
                        </div>
                      )}
                      {chat.isOfficial && <span className="official-check-dot">✓</span>}
                      {chat.id === 'dormtrack' && dormTrackUnreadCount > 0 && <span className="line-online-dot"></span>}
                    </div>
                    
                    <div className="line-chat-main">
                      <div className="line-chat-top-row">
                        <span className="line-chat-sender-dark">{chat.name}</span>
                        <span className="line-chat-time-dark">{chat.time}</span>
                      </div>
                      
                      <div className="line-chat-bottom-row">
                        <p className="line-chat-preview-dark">{chat.lastMsg}</p>
                        {chat.unreadCount !== 0 && chat.unreadCount !== '0' && (
                          <span className="line-unread-pill-green">{chat.unreadCount}</span>
                        )}
                        {chat.id === 'dormtrack' && waitingCount === 0 && (
                          <span className="line-done-check">✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LINE Style Bottom Navigation Bar (Matching Image 1: 5 Tabs in Thai + Red Badge) */}
            <nav className="line-bottom-nav">
              <button className="line-nav-tab" onClick={() => { setMobileOpenChatId(null); setActiveTab('all'); setSearchQuery(''); }}>
                <span className="line-nav-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <span className="line-nav-label">หน้าหลัก</span>
              </button>

              <button 
                className={`line-nav-tab ${!mobileOpenChatId ? 'active' : ''}`} 
                onClick={() => { setMobileOpenChatId(null); setChatTimelineFilter('all'); setActiveTab('all'); }}
              >
                <div className="icon-with-badge">
                  <span className="line-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                  </span>
                  <span className="nav-red-badge">{dormTrackUnreadCount > 0 ? dormTrackUnreadCount : '999+'}</span>
                </div>
                <span className="line-nav-label">แชท</span>
              </button>

              <button className="line-nav-tab">
                <div className="icon-with-badge">
                  <span className="line-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2"/>
                      <polyline points="2 17 12 22 22 17"/>
                      <polyline points="2 12 12 17 22 12"/>
                    </svg>
                  </span>
                  <span className="nav-red-dot"></span>
                </div>
                <span className="line-nav-label">VOOM</span>
              </button>

              <button className="line-nav-tab">
                <div className="icon-with-badge">
                  <span className="line-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </span>
                  <span className="nav-red-dot"></span>
                </div>
                <span className="line-nav-label">TODAY</span>
              </button>

              <button className="line-nav-tab">
                <div className="icon-with-badge">
                  <span className="line-nav-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="3"/>
                      <path d="M16 12h.01"/>
                      <path d="M2 10h20"/>
                    </svg>
                  </span>
                  <span className="nav-red-dot"></span>
                </div>
                <span className="line-nav-label">Wallet</span>
              </button>
            </nav>

            <div className="phone-home-bar"><div className="home-line"></div></div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* SIGNATURE MODAL (หน้าจอเซ็นรับแบบดิจิทัล)                           */}
      {/* ================================================================= */}
      {selectedPackage && (
        <div className="modal-overlay" onClick={() => setSelectedPackage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="modal-header">
              <button className="modal-close" onClick={() => setSelectedPackage(null)}>←</button>
              <h2>เซ็นรับพัสดุ</h2>
              <div style={{width: '24px'}}></div>
            </div>

            <div className="modal-body">
              <div className="modal-pkg-card">
                <img src={selectedPackage.image} className="modal-pkg-img" alt="Package" />
                <div className="modal-pkg-details">
                  <h4>{selectedPackage.id}</h4>
                  <p>{selectedPackage.sender} · {selectedPackage.arrivedAt.split(' ')[0]}</p>
                </div>
              </div>
              
              <div className="sig-main-card">
                <h3>ลงลายเซ็นดิจิทัล</h3>
                <p className="sig-subtitle">กรุณาเซ็นชื่อในกรอบด้านล่าง</p>
                
                <div className="sig-canvas-container" ref={canvasContainerRef}>
                  <SignatureCanvas 
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{ width: canvasWidth, height: 180, className: 'sigCanvas' }} 
                  />
                </div>

                <div className="modal-actions-group">
                  <button className="btn-primary full-width line-green-modal-btn" onClick={handleSign}>ยืนยันการรับพัสดุ</button>
                  <button className="btn-dark full-width" onClick={() => sigCanvas.current.clear()}>ล้างหน้าจอ</button>
                </div>
              </div>

              <p className="legal-text">
                เซ็นรับแบบอิเล็กทรอนิกส์ยืนยันตนถูกต้องตาม พ.ร.บ.
              </p>
            </div>
            
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* CLAIM MODAL (หน้าต่างแจ้งเป็นเจ้าของพัสดุที่ไม่ทราบชื่อ - Task 11)   */}
      {/* ================================================================= */}
      {claimModalPackage && (
        <ClaimModal 
          pkg={claimModalPackage}
          currentStudent={currentStudent}
          evidence={claimEvidence}
          setEvidence={setClaimEvidence}
          onClose={() => setClaimModalPackage(null)}
          onSubmit={handleConfirmClaim}
        />
      )}
    </div>
  )
}
