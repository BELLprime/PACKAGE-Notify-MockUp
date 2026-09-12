import { useEffect, useMemo, useState, useRef } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import PackageManagement from './components/PackageManagement'
import PackageForm from './components/PackageForm'
import UnknownPackages from './components/UnknownPackages'
import ConfirmDeleteModal from './components/ConfirmDeleteModal'
import Toast from './components/Toast'
import { initialPackages, blankForm, getStudentMatchStatus, mockStudents } from './data/mockData'

export default function App() {
  const [page, setPage] = useState('dashboard') // 'dashboard' | 'packages' | 'package-form' | 'unknown'
  const [filter, setFilter] = useState('all') // 'all' | 'A' | 'B' | 'unmatched'
  const [packages, setPackages] = useState(
    () => JSON.parse(localStorage.getItem('dorm-packages') || 'null') || initialPackages
  )
  const [form, setForm] = useState(blankForm)
  const [editingIndex, setEditingIndex] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [toast, setToast] = useState('')

  const lastUpdateRef = useRef(0)
  const lastResetRef = useRef(0)

  // Real-time synchronization กับ Backend API / MongoDB
  useEffect(() => {
    const syncFromBackend = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/packages')
        if (!res.ok) return
        const json = await res.json()
        if (!json.success || !Array.isArray(json.data)) return

        const serverUpdateTime = json.lastUpdateTime || 0
        const serverResetTime = json.resetTime || 0

        // หากมีการกดปุ่มรีเซ็ตระบบ
        if (lastResetRef.current && serverResetTime > lastResetRef.current) {
          lastResetRef.current = serverResetTime
          lastUpdateRef.current = serverUpdateTime
          localStorage.removeItem('dorm-packages')
          setPackages(initialPackages)
          return
        }

        if (serverUpdateTime > lastUpdateRef.current) {
          lastUpdateRef.current = serverUpdateTime
          if (serverResetTime) lastResetRef.current = serverResetTime

          const mapped = json.data.map(p => {
            const rawStatus = p.status
            const displayStatus = rawStatus === 'received' ? 'รับแล้ว' : 'รอรับพัสดุ'
            const match = getStudentMatchStatus({ recipient: p.recipient, studentId: p.student_id })
            const matchedStudent = match.matched ? match.student : null

            return {
              tracking: p.tracking,
              recipient: p.recipient,
              studentId: matchedStudent ? matchedStudent.student_id : (p.student_id || '-'),
              phone: matchedStudent ? matchedStudent.phone : '-',
              room: matchedStudent ? `${matchedStudent.building}-${matchedStudent.room_number}` : '-',
              building: matchedStudent ? matchedStudent.building : '-',
              status: displayStatus,
              isBroadcasted: Boolean(p.is_broadcasted),
              claimedBy: p.claimed_by || null,
              signatureData: p.signature_data || null,
              photoUrl: p.photo_url || '',
              date: p.arrival_date ? new Date(p.arrival_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : 'วันนี้',
              note: p.note || ''
            }
          })

          setPackages(mapped)
        }
      } catch (e) {
        // Backend offline; ใช้งานข้อมูลใน LocalStorage ต่อเนื่อง
      }
    }

    syncFromBackend()
    const timer = setInterval(syncFromBackend, 2000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    localStorage.setItem('dorm-packages', JSON.stringify(packages))
  }, [packages])

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const visiblePackages = useMemo(() => {
    return packages
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (filter === 'all') return true
        if (filter === 'unmatched') return !getStudentMatchStatus(item).matched
        return item.building === filter
      })
  }, [packages, filter])

  const unmatchedCount = useMemo(() => {
    return packages.filter(item => !getStudentMatchStatus(item).matched).length
  }, [packages])

  // คำนวณสถิติแดชบอร์ดตามข้อมูลจริงในระบบ
  const waitingCount = useMemo(() => {
    return packages.filter(
      item => item.status === 'รอรับพัสดุ' || item.status === 'รอรับ' || item.status === 'pending'
    ).length
  }, [packages])

  const studentsCount = mockStudents.length

  const totalReceived = useMemo(() => {
    return packages.filter(item => item.status === 'รับแล้ว' || item.status === 'received').length
  }, [packages])

  const todayReceived = useMemo(() => {
    return packages.filter(
      item =>
        (item.status === 'รับแล้ว' || item.status === 'received') &&
        (item.date === 'วันนี้' || item.receivedDate === 'วันนี้' || item.pickup_date)
    ).length
  }, [packages])

  const dashboard = (nextFilter = 'all') => {
    setFilter(nextFilter)
    setPage('dashboard')
  }

  const openManagePackages = () => {
    setPage('packages')
  }

  const openUnknownPackages = () => {
    setPage('unknown')
  }

  const newPackage = () => {
    setEditingIndex(null)
    setForm(blankForm)
    setPhotoUrl('')
    setPage('package-form')
  }

  const editPackage = (item, index) => {
    setEditingIndex(index)
    setForm({ ...blankForm, ...item, status: item.status || 'รอรับพัสดุ' })
    setPhotoUrl(item.photoUrl || '')
    setPage('package-form')
    window.scrollTo(0, 0)
  }

  const requestDelete = (item, index) => {
    setDeleteTarget({ item, index })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    const { item, index } = deleteTarget
    setPackages(current => current.filter((_, i) => i !== index))
    setToast(`ลบพัสดุ ${item.tracking} สำเร็จแล้ว`)
    setDeleteTarget(null)
  }

  const savePackage = async event => {
    event.preventDefault()
    // ดึงข้อมูลนักศึกษาจากชื่อที่กรอกอัตโนมัติ
    const match = getStudentMatchStatus(form)
    const matchedStudent = match.matched ? match.student : null
    const prevItem = editingIndex !== null ? packages[editingIndex] : null

    const item = {
      ...form,
      studentId: matchedStudent
        ? matchedStudent.student_id
        : (prevItem?.studentId || form.studentId || '-'),
      room: matchedStudent
        ? matchedStudent.room_number
        : (prevItem?.room || '-'),
      building: matchedStudent
        ? matchedStudent.building
        : (prevItem?.building || 'A'),
      phone: matchedStudent
        ? matchedStudent.phone
        : (prevItem?.phone || '-'),
      photoUrl,
      status: form.status || (editingIndex === null ? 'รอรับพัสดุ' : packages[editingIndex].status),
      date: editingIndex === null ? 'วันนี้' : packages[editingIndex].date,
    }
    setPackages(current =>
      editingIndex === null
        ? [item, ...current]
        : current.map((currentItem, index) => (index === editingIndex ? item : currentItem))
    )
    setToast(
      editingIndex === null ? 'บันทึกพัสดุใหม่เรียบร้อยแล้ว' : 'อัปเดตข้อมูลพัสดุเรียบร้อยแล้ว'
    )

    // บันทึกและซิงค์ไปยัง Backend API (Port 5000) ทันที เพื่อส่งข้อมูลลง MongoDB และแจ้งเตือนไปยัง Student UI!
    try {
      if (editingIndex === null) {
        await fetch('http://localhost:5000/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracking: item.tracking,
            recipient: item.recipient,
            photo_url: photoUrl,
            note: item.note,
            student_id: item.studentId !== '-' ? item.studentId : null
          })
        })
      }
    } catch (err) {
      console.warn('Backend save package failed:', err.message)
    }

    setEditingIndex(null)
    setForm(blankForm)
    setPhotoUrl('')
    setPage('packages')
  }

  // รีเซ็ตข้อมูลพัสดุกลับสู่ค่าเริ่มต้น
  const handleResetData = async () => {
    if (window.confirm('คุณต้องการรีเซ็ตข้อมูลพัสดุและประกาศกลับสู่ค่าเริ่มต้นหรือไม่?')) {
      localStorage.removeItem('dorm-packages')
      setPackages(initialPackages)
      setToast('🔄 รีเซ็ตข้อมูลพัสดุกลับสู่ค่าเริ่มต้นเรียบร้อยแล้ว')
      try {
        await fetch('http://localhost:5000/api/packages/reset', { method: 'POST' })
      } catch (err) {}
    }
  }

  // ส่ง Broadcast ประกาศหาเจ้าของพัสดุรายชิ้น (FR-04)
  const broadcastPackage = async index => {
    const target = packages[index]
    if (!target) return
    if (
      target.status === 'รับแล้ว' ||
      target.status === 'received' ||
      target.claimedBy ||
      target.isBroadcasted
    ) {
      setToast(`⚠️ ไม่สามารถ Broadcast พัสดุ ${target.tracking} ซ้ำได้`)
      return
    }

    setPackages(current =>
      current.map((item, i) => (i === index ? { ...item, isBroadcasted: true } : item))
    )
    setToast(`📢 ส่ง Broadcast ประกาศหาเจ้าของพัสดุ ${target.tracking} ไปยังบอร์ดกลางแล้ว`)

    // ซิงค์กับ Backend API เพื่อให้ Student UI เด้งแจ้งเตือนแบบ Real-time!
    try {
      await fetch('http://localhost:5000/api/packages/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tracking: target.tracking,
          recipient: target.recipient,
          photoUrl: target.photoUrl,
          note: target.note,
          carrier: target.carrier || 'Flash Express',
          foundLocation: `ห้องพัสดุตึก ${target.building || 'A'}`
        })
      })
    } catch (err) {
      console.warn('Backend offline or not running:', err.message)
    }
  }

  // ส่ง Broadcast ประกาศพัสดุไม่ทราบชื่อทั้งหมด (FR-04)
  const broadcastAllPackages = async () => {
    const unMatchedToBroadcast = packages.filter(
      item =>
        !getStudentMatchStatus(item).matched &&
        !item.isBroadcasted &&
        item.status !== 'รับแล้ว' &&
        item.status !== 'received' &&
        !item.claimedBy &&
        item.status !== 'claimed'
    )

    if (unMatchedToBroadcast.length === 0) {
      setToast('⚠️ ไม่มีพัสดุใหม่ที่ต้อง Broadcast')
      return
    }

    setPackages(current =>
      current.map(item =>
        !getStudentMatchStatus(item).matched &&
        !item.isBroadcasted &&
        item.status !== 'รับแล้ว' &&
        item.status !== 'received' &&
        !item.claimedBy
          ? { ...item, isBroadcasted: true }
          : item
      )
    )
    setToast(`📢 ส่ง Broadcast ประกาศพัสดุไม่ทราบชื่อ ${unMatchedToBroadcast.length} ชิ้นไปยังบอร์ดกลางเรียบร้อยแล้ว`)

    // ซิงค์ทุกชิ้นไปยัง Backend
    for (const target of unMatchedToBroadcast) {
      try {
        await fetch('http://localhost:5000/api/packages/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tracking: target.tracking,
            recipient: target.recipient,
            photoUrl: target.photoUrl,
            note: target.note,
            carrier: target.carrier || 'Flash Express',
            foundLocation: `ห้องพัสดุตึก ${target.building || 'A'}`
          })
        })
      } catch (err) {}
    }
  }

  // จับคู่นักศึกษาด้วยตนเอง (Manual Match) เมื่อนักศึกษามาแสดงตัว
  const manualMatchPackage = async (index, student) => {
    const target = packages[index]
    setPackages(current =>
      current.map((item, i) => {
        if (i !== index) return item
        return {
          ...item,
          recipient: student.fullNameTh || `${student.first_name} ${student.last_name}`,
          studentId: student.student_id,
          room: `${student.building}-${student.room_number}`,
          building: student.building,
          phone: student.phone || item.phone,
          status: 'รอรับพัสดุ',
          note: `จับคู่กับนักศึกษา ${student.student_id} เรียบร้อยแล้ว`,
        }
      })
    )
    setToast(
      `✅ จับคู่พัสดุกับ ${student.first_name} (${student.student_id}) สำเร็จ พัสดุถูกย้ายเข้ารายการปกติแล้ว`
    )

    if (target) {
      try {
        await fetch(`http://localhost:5000/api/packages/${target.tracking}/match`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: student.student_id })
        })
      } catch (err) {
        console.warn('Backend match sync failed:', err.message)
      }
    }
  }

  return (
    <>
      <Navbar
        page={page}
        onGoDashboard={dashboard}
        onGoPackages={openManagePackages}
        onGoUnknown={openUnknownPackages}
        onReset={handleResetData}
        unmatchedCount={unmatchedCount}
      />

      <main>
        {page === 'dashboard' && (
          <Dashboard
            visiblePackages={visiblePackages}
            unmatchedCount={unmatchedCount}
            waitingCount={waitingCount}
            todayReceived={todayReceived}
            totalReceived={totalReceived}
            studentsCount={studentsCount}
            filter={filter}
            setFilter={setFilter}
            onNew={newPackage}
            onEdit={editPackage}
          />
        )}

        {page === 'packages' && (
          <PackageManagement
            packages={packages}
            onNew={newPackage}
            onEdit={editPackage}
            onDelete={requestDelete}
          />
        )}

        {page === 'unknown' && (
          <UnknownPackages
            packages={packages}
            onBroadcast={broadcastPackage}
            onBroadcastAll={broadcastAllPackages}
            onManualMatch={manualMatchPackage}
            onEdit={editPackage}
            onDelete={requestDelete}
          />
        )}

        {page === 'package-form' && (
          <PackageForm
            form={form}
            setForm={setForm}
            photoUrl={photoUrl}
            setPhotoUrl={setPhotoUrl}
            isEditing={editingIndex !== null}
            onSave={savePackage}
            onCancel={openManagePackages}
            onDashboard={() => dashboard('all')}
          />
        )}
      </main>

      <ConfirmDeleteModal
        target={deleteTarget}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast message={toast} />
    </>
  )
}
